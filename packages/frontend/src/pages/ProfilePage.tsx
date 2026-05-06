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

  const inputClass = 'w-full px-3 py-2.5 border border-[#ccc] text-[#1a1a2e] text-sm bg-[#fafaf8] outline-none transition-colors duration-200 focus:border-[#1a1a2e] focus:bg-white placeholder-[#bbb]';
  const inputStyle = { borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-2 py-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      <div className="bg-white border border-[#d8d4cc] p-10 text-center" style={{ borderRadius: '4px' }}>
        <div className="w-16 h-16 bg-[#e8e4dc] rounded-full mx-auto mb-4" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div className="h-3 bg-[#e8e4dc] rounded w-48 mx-auto" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-2 py-4 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .pr-card { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; }
        .section-label { font-size:11px; font-weight:500; color:#6b6b6b; letter-spacing:0.1em; text-transform:uppercase; }
        .pr-btn { padding:10px 20px; font-size:12px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; border:none; cursor:pointer; border-radius:2px; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        .pr-btn-primary { background:#1a1a2e; color:#fff; }
        .pr-btn-primary:hover { background:#2d2d4e; }
        .pr-btn-secondary { background:#fafaf8; color:#1a1a2e; border:0.5px solid #d8d4cc !important; }
        .pr-btn-secondary:hover { border-color:#1a1a2e !important; }
        .pr-btn-gold { background:#c8a96e; color:#1a1a2e; }
        .pr-btn-gold:hover { background:#d4b87a; }
        .pr-btn-sm { padding:7px 14px; font-size:11px; }
        .vehicle-item { background:#fafaf8; border:0.5px solid #e8e4dc; border-radius:2px; padding:1rem; transition:border-color 0.2s; }
        .vehicle-item:hover { border-color:#1a1a2e; }
        .rating-item { background:#fafaf8; border:0.5px solid #e8e4dc; border-radius:2px; padding:0.875rem; }
        .info-field p:first-child { font-size:11px; color:#999; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:3px; }
        .info-field p:last-child { font-size:14px; color:#1a1a2e; font-weight:500; }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {/* Feedback */}
      {feedback && (
        <div
          className="flex items-center gap-3 px-4 py-3 text-sm"
          style={{ background: '#f0faf4', borderLeft: '3px solid #2d7a4f', color: '#2d7a4f', borderRadius: '0 2px 2px 0' }}
        >
          <span>{feedback}</span>
        </div>
      )}

      {/* Profile header */}
      <div className="pr-card overflow-hidden">
        <div className="bg-[#1a1a2e] px-8 py-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div
              className="w-16 h-16 bg-[#c8a96e] flex items-center justify-center text-2xl font-medium text-[#1a1a2e] shrink-0"
              style={{ borderRadius: '2px', fontFamily: "'Playfair Display', serif" }}
            >
              {profile?.name?.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl text-white tracking-wide" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
                {profile?.name}
              </h1>
              <p className="text-[#8a8fa8] text-sm mt-0.5">{profile?.email}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                <span
                  className="text-xs font-medium tracking-widest uppercase px-2.5 py-1"
                  style={{ background: 'rgba(200,169,110,0.15)', color: '#c8a96e', borderRadius: '2px' }}
                >
                  {profile?.role === 'ADMIN' ? 'Administrador' : 'Estudiante'}
                </span>
                {profile?.isVerified && (
                  <span
                    className="text-xs font-medium tracking-widest uppercase px-2.5 py-1"
                    style={{ background: 'rgba(45,122,79,0.2)', color: '#7dd5a4', borderRadius: '2px' }}
                  >
                    Verificado
                  </span>
                )}
                <span className="text-[#c8a96e] text-sm">
                  {renderStars(profile?.reputation || 5)} <span className="text-[#8a8fa8] text-xs">({ratings?.count || 0})</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => setEditMode(!editMode)}
              className={`pr-btn shrink-0 ${editMode ? 'pr-btn-secondary' : 'pr-btn-gold'}`}
              style={editMode ? { border: '0.5px solid #d8d4cc' } : {}}
            >
              {editMode ? '✕ Cancelar' : 'Editar perfil'}
            </button>
          </div>
        </div>
        <div className="w-full h-px bg-[#c8a96e] opacity-40" />
      </div>

      {/* Edit profile form */}
      {editMode && (
        <form onSubmit={handleSaveProfile} className="pr-card p-6 space-y-5">
          <p className="section-label pb-4 border-b border-[#e8e4dc]">Editar perfil</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Nombre',               key: 'name',             type: 'text', placeholder: '' },
              { label: 'Carrera',              key: 'career',           type: 'text', placeholder: 'Ingeniería de Sistemas' },
              { label: 'Teléfono',             key: 'phone',            type: 'text', placeholder: '+593 99...' },
              { label: 'Zona',                 key: 'zone',             type: 'text', placeholder: 'Norte' },
              { label: 'Barrio',               key: 'neighborhood',     type: 'text', placeholder: '' },
              { label: 'Contacto emergencia',  key: 'emergencyContact', type: 'text', placeholder: '' },
              { label: 'Tel. emergencia',      key: 'emergencyPhone',   type: 'text', placeholder: '' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">{label}</label>
                <input
                  type={type}
                  className={inputClass}
                  style={inputStyle}
                  placeholder={placeholder}
                  value={editData[key] || ''}
                  onChange={e => setEditData({ ...editData, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Bio</label>
            <textarea
              className={inputClass}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              placeholder="Cuéntanos algo de ti..."
              value={editData.bio || ''}
              onChange={e => setEditData({ ...editData, bio: e.target.value })}
            />
          </div>
          <button type="submit" className="pr-btn pr-btn-primary">Guardar cambios</button>
        </form>
      )}

      {/* Profile info */}
      {!editMode && profile && (
        <div className="pr-card p-6">
          <p className="section-label mb-5">Información personal</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Carrera',             value: profile.career },
              { label: 'Teléfono',            value: profile.phone },
              { label: 'Zona',                value: profile.zone },
              { label: 'Barrio',              value: profile.neighborhood },
              { label: 'Contacto emergencia', value: profile.emergencyContact },
              { label: 'Tel. emergencia',     value: profile.emergencyPhone },
            ].map(item => (
              <div key={item.label} className="info-field">
                <p>{item.label}</p>
                <p>{item.value || <span style={{ color: '#ccc', fontStyle: 'italic', fontWeight: 400 }}>Sin completar</span>}</p>
              </div>
            ))}
          </div>
          {profile.bio && (
            <div className="mt-5 px-4 py-3 bg-[#fafaf8] border-l-2 border-[#c8a96e]">
              <p className="text-[#555] text-sm">{profile.bio}</p>
            </div>
          )}
        </div>
      )}

      {/* Vehicles */}
      <div className="pr-card p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="section-label">Mis vehículos</p>
          <button
            onClick={() => setShowVehicleForm(!showVehicleForm)}
            className={`pr-btn pr-btn-sm ${showVehicleForm ? 'pr-btn-secondary' : 'pr-btn-primary'}`}
            style={showVehicleForm ? { border: '0.5px solid #d8d4cc' } : {}}
          >
            {showVehicleForm ? '✕ Cancelar' : '+ Agregar'}
          </button>
        </div>

        {showVehicleForm && (
          <form onSubmit={handleAddVehicle} className="mb-5 p-4 bg-[#fafaf8] border border-[#e8e4dc] space-y-3" style={{ borderRadius: '2px' }}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { placeholder: 'Placa *',     key: 'plate',    type: 'text',   required: true  },
                { placeholder: 'Marca *',     key: 'brand',    type: 'text',   required: true  },
                { placeholder: 'Modelo *',    key: 'model',    type: 'text',   required: true  },
                { placeholder: 'Color *',     key: 'color',    type: 'text',   required: true  },
                { placeholder: 'Capacidad *', key: 'capacity', type: 'number', required: true  },
                { placeholder: 'Año',         key: 'year',     type: 'number', required: false },
              ].map(({ placeholder, key, type, required }) => (
                <input
                  key={key}
                  type={type}
                  className={inputClass}
                  style={inputStyle}
                  placeholder={placeholder}
                  required={required}
                  value={(vehicleForm as any)[key]}
                  onChange={e => setVehicleForm({ ...vehicleForm, [key]: e.target.value })}
                />
              ))}
            </div>
            <button type="submit" className="pr-btn pr-btn-gold pr-btn-sm">Registrar vehículo</button>
          </form>
        )}

        {vehicles.length === 0 ? (
          <p className="text-[#bbb] text-sm">No tienes vehículos registrados</p>
        ) : (
          <div className="space-y-2">
            {vehicles.map(v => (
              <div key={v.id} className="vehicle-item flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <p className="text-[#1a1a2e] text-sm font-medium">
                    {v.brand} {v.model}
                    <span className="text-[#999] font-normal ml-1">({v.year || '—'})</span>
                  </p>
                  <p className="text-[#999] text-xs mt-0.5">
                    {v.plate} · {v.color} · {v.capacity} asientos
                  </p>
                </div>
                <button
                  onClick={() => deleteVehicle(v.id)}
                  className="text-xs font-medium px-3 py-1.5 transition-colors"
                  style={{
                    background: '#fdf2f2', color: '#c0392b',
                    border: '0.5px solid #f0b8b8', borderRadius: '2px',
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ratings */}
      {ratings && ratings.ratings.length > 0 && (
        <div className="pr-card p-6">
          <p className="section-label mb-5">Calificaciones recibidas</p>

          {/* Average */}
          <div className="flex items-center gap-5 mb-5 px-5 py-4 bg-[#fafaf8] border border-[#e8e4dc]" style={{ borderRadius: '2px' }}>
            <span
              className="text-3xl font-medium text-[#c8a96e]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {ratings.average.toFixed(1)}
            </span>
            <div>
              <p className="text-[#c8a96e] text-base">{renderStars(ratings.average)}</p>
              <p className="text-[#999] text-xs mt-0.5">{ratings.count} calificaciones</p>
            </div>
          </div>

          <div className="space-y-2">
            {ratings.ratings.slice(0, 5).map(r => (
              <div key={r.id} className="rating-item flex items-start gap-4">
                <span
                  className="text-xs font-medium px-2 py-0.5 shrink-0"
                  style={{ background: '#fdf8f0', color: '#8a6a2e', border: '0.5px solid #e8d5b0', borderRadius: '2px' }}
                >
                  {r.score}/5
                </span>
                <div>
                  {r.comment && <p className="text-[#555] text-sm">{r.comment}</p>}
                  <p className="text-[#bbb] text-xs mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};