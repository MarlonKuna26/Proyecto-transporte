import React, { useEffect, useState, FormEvent } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile, Vehicle, Rating } from '@/types';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [ratings, setRatings] = useState<{ ratings: Rating[]; average: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [editData, setEditData] = useState<any>({});
  const [vehicleForm, setVehicleForm] = useState({ plate: '', brand: '', model: '', color: '', capacity: '4', year: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [p, v, r] = await Promise.all([
          api.users.getProfile(),
          api.users.getVehicles(),
          api.ratings.byUser(user!.id),
        ]);
        setProfile(p.data);
        setVehicles(v.data || []);
        setRatings(r.data);
        setEditData(p.data || {});
      } catch { }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.users.updateProfile(editData);
      setProfile(res.data);
      setEditMode(false);
      setFeedback('Perfil actualizado');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  const handleAddVehicle = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.users.createVehicle({ ...vehicleForm, capacity: parseInt(vehicleForm.capacity), year: vehicleForm.year ? parseInt(vehicleForm.year) : undefined });
      const res = await api.users.getVehicles();
      setVehicles(res.data || []);
      setShowVehicleForm(false);
      setVehicleForm({ plate: '', brand: '', model: '', color: '', capacity: '4', year: '' });
      setFeedback('Vehículo registrado');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      await api.users.deleteVehicle(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
      setFeedback('Vehículo eliminado');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  const renderStars = (score: number) => '★'.repeat(Math.round(score)) + '☆'.repeat(5 - Math.round(score));

  if (loading) return <div className="max-w-4xl mx-auto"><div className="glass-card p-12 animate-pulse text-center"><div className="h-16 w-16 bg-dark-200 rounded-full mx-auto mb-4" /><div className="h-4 bg-dark-200 rounded w-48 mx-auto" /></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {feedback && <div className="p-3 rounded-xl bg-primary-50 border border-primary-200 text-primary-700 text-sm">✅ {feedback}</div>}

      {/* Profile header */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary-500 flex items-center justify-center text-3xl font-bold text-white shadow-blue">
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-navy-900">{profile?.name}</h1>
            <p className="text-dark-500">{profile?.email}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
              <span className="badge-info">{profile?.role === 'ADMIN' ? 'Administrador' : 'Estudiante'}</span>
              {profile?.isVerified && <span className="badge-success">✓ Verificado</span>}
              <span className="text-primary-600 text-sm" title={`Reputación: ${profile?.reputation}`}>
                {renderStars(profile?.reputation || 5)} ({ratings?.count || 0})
              </span>
            </div>
          </div>
          <button onClick={() => setEditMode(!editMode)} className={editMode ? 'btn-secondary' : 'btn-primary'}>
            {editMode ? '✖ Cancelar' : '✏️ Editar'}
          </button>
        </div>
      </div>

      {/* Edit profile */}
      {editMode && (
        <form onSubmit={handleSaveProfile} className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-navy-900 mb-2">Editar perfil</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-dark-500 mb-1">Nombre</label><input className="input-field" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Carrera</label><input className="input-field" value={editData.career || ''} onChange={e => setEditData({ ...editData, career: e.target.value })} placeholder="Ingeniería de Sistemas" /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Teléfono</label><input className="input-field" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} placeholder="+593 99..." /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Zona</label><input className="input-field" value={editData.zone || ''} onChange={e => setEditData({ ...editData, zone: e.target.value })} placeholder="Norte" /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Barrio</label><input className="input-field" value={editData.neighborhood || ''} onChange={e => setEditData({ ...editData, neighborhood: e.target.value })} /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Contacto emergencia</label><input className="input-field" value={editData.emergencyContact || ''} onChange={e => setEditData({ ...editData, emergencyContact: e.target.value })} /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Tel. emergencia</label><input className="input-field" value={editData.emergencyPhone || ''} onChange={e => setEditData({ ...editData, emergencyPhone: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm text-dark-500 mb-1">Bio</label><textarea className="input-field min-h-[80px]" value={editData.bio || ''} onChange={e => setEditData({ ...editData, bio: e.target.value })} placeholder="Cuéntanos algo de ti..." /></div>
          <button type="submit" className="btn-accent">💾 Guardar cambios</button>
        </form>
      )}

      {/* Profile info */}
      {!editMode && profile && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-navy-900 mb-4">Información personal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Carrera', value: profile.career },
              { label: 'Teléfono', value: profile.phone },
              { label: 'Zona', value: profile.zone },
              { label: 'Barrio', value: profile.neighborhood },
              { label: 'Contacto emergencia', value: profile.emergencyContact },
              { label: 'Tel. emergencia', value: profile.emergencyPhone },
            ].map(item => (
              <div key={item.label}>
                <p className="text-dark-400 text-xs">{item.label}</p>
                <p className="text-navy-900 font-medium">{item.value || <span className="text-dark-300 italic">Sin completar</span>}</p>
              </div>
            ))}
          </div>
          {profile.bio && <div className="mt-4 p-3 rounded-xl bg-primary-50"><p className="text-dark-600 text-sm">{profile.bio}</p></div>}
        </div>
      )}

      {/* Vehicles */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-navy-900">🚗 Mis vehículos</h2>
          <button onClick={() => setShowVehicleForm(!showVehicleForm)} className={showVehicleForm ? 'btn-secondary text-sm' : 'btn-primary text-sm'}>
            {showVehicleForm ? '✖ Cancelar' : '➕ Agregar'}
          </button>
        </div>

        {showVehicleForm && (
          <form onSubmit={handleAddVehicle} className="mb-4 p-4 rounded-xl bg-dark-50 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input className="input-field" placeholder="Placa *" value={vehicleForm.plate} onChange={e => setVehicleForm({ ...vehicleForm, plate: e.target.value })} required />
              <input className="input-field" placeholder="Marca *" value={vehicleForm.brand} onChange={e => setVehicleForm({ ...vehicleForm, brand: e.target.value })} required />
              <input className="input-field" placeholder="Modelo *" value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} required />
              <input className="input-field" placeholder="Color *" value={vehicleForm.color} onChange={e => setVehicleForm({ ...vehicleForm, color: e.target.value })} required />
              <input type="number" className="input-field" placeholder="Capacidad *" value={vehicleForm.capacity} onChange={e => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} required />
              <input type="number" className="input-field" placeholder="Año" value={vehicleForm.year} onChange={e => setVehicleForm({ ...vehicleForm, year: e.target.value })} />
            </div>
            <button type="submit" className="btn-accent text-sm">Registrar vehículo</button>
          </form>
        )}

        {vehicles.length === 0 ? (
          <p className="text-dark-400 text-sm">No tienes vehículos registrados</p>
        ) : (
          <div className="space-y-3">
            {vehicles.map(v => (
              <div key={v.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 rounded-xl bg-dark-50 border border-primary-100">
                <div>
                  <p className="text-navy-900 font-medium">{v.brand} {v.model} <span className="text-dark-400">({v.year || '—'})</span></p>
                  <p className="text-dark-500 text-xs mt-0.5">🔢 {v.plate} • 🎨 {v.color} • 💺 {v.capacity} asientos</p>
                </div>
                <button onClick={() => deleteVehicle(v.id)} className="text-red-500 hover:text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  🗑️ Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ratings */}
      {ratings && ratings.ratings.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-navy-900 mb-4">⭐ Calificaciones recibidas</h2>
          <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-primary-50">
            <div className="text-3xl font-bold text-primary-600">{ratings.average.toFixed(1)}</div>
            <div>
              <p className="text-primary-600">{renderStars(ratings.average)}</p>
              <p className="text-dark-400 text-xs">{ratings.count} calificaciones</p>
            </div>
          </div>
          <div className="space-y-2">
            {ratings.ratings.slice(0, 5).map(r => (
              <div key={r.id} className="p-3 rounded-xl bg-dark-50 flex items-start gap-3">
                <span className="text-primary-600 text-sm font-bold">{r.score}/5</span>
                <div>
                  {r.comment && <p className="text-dark-600 text-sm">{r.comment}</p>}
                  <p className="text-dark-400 text-xs mt-1">{new Date(r.createdAt).toLocaleDateString('es')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
