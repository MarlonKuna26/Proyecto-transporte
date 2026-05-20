import React, { useEffect, useState, FormEvent } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile, Vehicle, Rating } from '@/types';
import { ESTRUCTURA_UTA, ZONAS_AMBATO, VEHICULO_DATA } from '@/constants';


export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [ratings, setRatings] = useState<{ ratings: Rating[]; average: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [editData, setEditData] = useState<any>({});
  const [vehicleForm, setVehicleForm] = useState({ plate: '', brand: '', model: '', color: '', capacity: '4', year: '', photoUrl: '' });
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(null);
  const [facultadSeleccionada, setFacultadSeleccionada] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let onlyNums = value.replace(/[^0-9]/g, '');
    
    if (onlyNums.length > 0 && !onlyNums.startsWith('0')) onlyNums = '0' + onlyNums;
    if (onlyNums.length > 1 && !onlyNums.startsWith('09')) onlyNums = '09' + onlyNums.substring(2);
    
    const finalValue = onlyNums.slice(0, 10);
    setEditData({ ...editData, [name]: finalValue });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFeedback('La imagen es muy pesada (máximo 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPhotoPreview(base64String);
      setEditData({ ...editData, photoUrl: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleVehicleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'plate') {
      finalValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (finalValue.length === 3 && !finalValue.includes('-')) {
        finalValue = finalValue + '-';
      }
      finalValue = finalValue.slice(0, 8);
    }

    if (name === 'year') {
      if (value.length > 4) return;
    }

    setVehicleForm({ ...vehicleForm, [name]: finalValue });
  };

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
        if (p.data?.photoUrl) setPhotoPreview(p.data.photoUrl);
        if (p.data?.faculty) setFacultadSeleccionada(p.data.faculty);
      } catch { }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    
    const phoneRegex = /^09\d{8}$/;
    if (editData.phone && !phoneRegex.test(editData.phone)) {
      setFeedback('El teléfono personal debe ser un número válido de Ecuador (10 dígitos, empieza con 09)');
      return;
    }
    if (editData.emergencyPhone && !phoneRegex.test(editData.emergencyPhone)) {
      setFeedback('El teléfono de emergencia debe ser un número válido de Ecuador (10 dígitos, empieza con 09)');
      return;
    }

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

  const handleVehiclePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFeedback('La imagen es muy pesada (máximo 2MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setVehiclePhotoPreview(base64String);
      setVehicleForm({ ...vehicleForm, photoUrl: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleVehicleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const plateRegex = /^[A-Z]{3}-\d{3,4}$/;
    if (!plateRegex.test(vehicleForm.plate)) {
      setFeedback('La placa no es válida (ej: ABC-1234)');
      return;
    }

    const year = parseInt(vehicleForm.year);
    const currentYear = new Date().getFullYear();
    if (vehicleForm.year && (year < 1950 || year > currentYear + 1)) {
      setFeedback('El año del vehículo no es lógico');
      return;
    }

    try {
      const payload: any = {
        plate: vehicleForm.plate,
        brand: vehicleForm.brand,
        model: vehicleForm.model,
        color: vehicleForm.color,
        capacity: parseInt(vehicleForm.capacity),
      };
      if (vehicleForm.year) payload.year = parseInt(vehicleForm.year);
      if (vehicleForm.photoUrl) payload.photoUrl = vehicleForm.photoUrl;

      if (editingVehicleId) {
        await api.users.updateVehicle(editingVehicleId, payload);
        setFeedback('Vehículo actualizado');
      } else {
        await api.users.createVehicle(payload);
        setFeedback('Vehículo registrado');
      }

      const res = await api.users.getVehicles();
      setVehicles(res.data || []);
      setShowVehicleForm(false);
      setVehicleForm({ plate: '', brand: '', model: '', color: '', capacity: '4', year: '', photoUrl: '' });
      setVehiclePhotoPreview(null);
      setEditingVehicleId(null);
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
        .avatar-container { position:relative; width:80px; height:80px; }
        .avatar-img { width:100%; height:100%; object-fit:cover; border-radius:4px; border:2px solid #c8a96e; }
        .avatar-placeholder { width:100%; height:100%; background:#c8a96e; color:#1a1a2e; display:flex; items-center; justify-center; font-size:32px; border-radius:4px; }
        .edit-photo-btn { position:absolute; bottom:-5px; right:-5px; background:#1a1a2e; color:white; width:24px; height:24px; border-radius:50%; display:flex; items-center; justify-center; cursor:pointer; border:1px solid #c8a96e; font-size:12px; }
      `}</style>

      {/* Feedback */}
      {feedback && (
        <div
          className="flex items-center gap-3 px-4 py-3 text-sm mb-4"
          style={{ 
            background: feedback.includes('actualizado') || feedback.includes('registrado') ? '#f0faf4' : '#fdf2f2', 
            borderLeft: `3px solid ${feedback.includes('actualizado') || feedback.includes('registrado') ? '#2d7a4f' : '#c0392b'}`, 
            color: feedback.includes('actualizado') || feedback.includes('registrado') ? '#2d7a4f' : '#c0392b', 
            borderRadius: '0 2px 2px 0' 
          }}
        >
          <span>{feedback}</span>
        </div>
      )}

      {/* Profile header */}
      <div className="pr-card overflow-hidden">
        <div className="bg-[#1a1a2e] px-8 py-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar con subida de foto */}
            <div className="avatar-container shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {profile?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              {editMode && (
                <label className="edit-photo-btn" title="Cambiar foto">
                  <CameraIcon />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
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
            {/* Nombre completo */}
            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Nombre</label>
              <input type="text" className={inputClass} style={inputStyle} value={editData.name || ''}
                onChange={e => setEditData({ ...editData, name: e.target.value })} />
            </div>

            {/* Selector de Facultad */}
            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Facultad</label>
              <select
                className={inputClass}
                style={inputStyle}
                value={facultadSeleccionada}
                onChange={(e) => {
                  const nuevaFacultad = e.target.value;
                  setFacultadSeleccionada(nuevaFacultad);
                  setEditData({ ...editData, faculty: nuevaFacultad, career: '' });
                }}
              >
                <option value="">Selecciona Facultad</option>
                {Object.keys(ESTRUCTURA_UTA).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Selector de Carrera (Anidado) */}
            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Carrera</label>
              <select
                className={inputClass}
                style={inputStyle}
                disabled={!facultadSeleccionada}
                value={editData.career || ''}
                onChange={e => setEditData({ ...editData, career: e.target.value })}
              >
                <option value="">Selecciona Carrera</option>
                {facultadSeleccionada && ESTRUCTURA_UTA[facultadSeleccionada as keyof typeof ESTRUCTURA_UTA].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Selector de Zona */}
            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Zona de Residencia</label>
              <select className={inputClass} style={inputStyle} value={editData.zone || ''}
                onChange={e => setEditData({ ...editData, zone: e.target.value })}>
                <option value="">¿Por dónde vives?</option>
                {ZONAS_AMBATO.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>

            {/* Teléfonos con Validación real */}
            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Teléfono Personal (09...)</label>
              <input name="phone" type="text" className={inputClass} style={inputStyle} placeholder="0991234567"
                value={editData.phone || ''} onChange={handlePhoneInputChange} />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Tel. Emergencia (09...)</label>
              <input name="emergencyPhone" type="text" className={inputClass} style={inputStyle} placeholder="0991234567"
                value={editData.emergencyPhone || ''} onChange={handlePhoneInputChange} />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Barrio</label>
              <input type="text" className={inputClass} style={inputStyle} value={editData.neighborhood || ''}
                onChange={e => setEditData({ ...editData, neighborhood: e.target.value })} />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Nombre Contacto Emergencia</label>
              <input type="text" className={inputClass} style={inputStyle} value={editData.emergencyContact || ''}
                onChange={e => setEditData({ ...editData, emergencyContact: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="pr-btn pr-btn-primary w-full">Guardar Cambios</button>
        </form>
      )}

      {/* Profile info */}
      {!editMode && profile && (
        <div className="pr-card p-6">
          <p className="section-label mb-5">Información personal</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Carrera', value: profile.career },
              { label: 'Teléfono', value: profile.phone },
              { label: 'Zona', value: profile.zone },
              { label: 'Barrio', value: profile.neighborhood },
              { label: 'Contacto emergencia', value: profile.emergencyContact },
              { label: 'Tel. emergencia', value: profile.emergencyPhone },
            ].map(item => (
              <div key={item.label} className="info-field">
                <p>{item.label}</p>
                <p>{item.value || <span style={{ color: '#ccc', fontStyle: 'italic', fontWeight: 400 }}>Sin completar</span>}</p>
              </div>
            ))}
          </div>
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
              {/* Placa */}
              <div className="col-span-1">
                <label className="block text-[10px] text-[#999] uppercase mb-1 ml-1">Placa (ABC-1234)</label>
                <input name="plate" className={inputClass} style={inputStyle} placeholder="ABC-1234" 
                  required value={vehicleForm.plate} onChange={handleVehicleInputChange} />
              </div>

              {/* Marca */}
              <div className="col-span-1">
                <label className="block text-[10px] text-[#999] uppercase mb-1 ml-1">Marca</label>
                <select name="brand" className={inputClass} style={inputStyle} required value={vehicleForm.brand} 
                  onChange={handleVehicleInputChange}>
                  <option value="">Selecciona *</option>
                  {VEHICULO_DATA.marcas.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Modelo */}
              <div className="col-span-1">
                <label className="block text-[10px] text-[#999] uppercase mb-1 ml-1">Modelo</label>
                <input name="model" className={inputClass} style={inputStyle} placeholder="Ej: Aveo" 
                  required value={vehicleForm.model} onChange={handleVehicleInputChange} />
              </div>

              {/* Color */}
              <div className="col-span-1">
                <label className="block text-[10px] text-[#999] uppercase mb-1 ml-1">Color</label>
                <select name="color" className={inputClass} style={inputStyle} required value={vehicleForm.color} 
                  onChange={handleVehicleInputChange}>
                  <option value="">Selecciona *</option>
                  {VEHICULO_DATA.colores.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Capacidad */}
              <div className="col-span-1">
                <label className="block text-[10px] text-[#999] uppercase mb-1 ml-1">Asientos (máx 45)</label>
                <input 
                  name="capacity" 
                  type="number" 
                  min="1" 
                  max="45" 
                  className={inputClass} 
                  style={inputStyle} 
                  required 
                  value={vehicleForm.capacity} 
                  onChange={e => {
                    let val = e.target.value.replace(/[^0-9]/g, '');
                    if (parseInt(val) > 45) val = '45';
                    setVehicleForm({ ...vehicleForm, capacity: val });
                  }} 
                />
              </div>

              {/* Año */}
              <div className="col-span-1">
                <label className="block text-[10px] text-[#999] uppercase mb-1 ml-1">Año</label>
                <input name="year" type="number" className={inputClass} style={inputStyle} 
                  placeholder="2024" value={vehicleForm.year} onChange={handleVehicleInputChange} />
              </div>
            </div>
            <button type="submit" className="pr-btn pr-btn-gold pr-btn-sm w-full">Registrar vehículo</button>
          </form>
        )}

        {vehicles.length === 0 ? (
          <p className="text-[#bbb] text-sm">No tienes vehículos registrados</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vehicles.map(v => (
              <div key={v.id} className="vehicle-item flex items-center justify-between">
                <div>
                  <p className="text-[#1a1a2e] text-sm font-medium">
                    {v.brand} {v.model}
                    <span className="text-[#999] font-normal ml-1">({v.year || '—'})</span>
                  </p>
                  <p className="text-[#999] text-xs mt-0.5 uppercase tracking-wider">
                    {v.plate} · {v.color} · {v.capacity} asientos
                  </p>
                </div>
                <button
                  onClick={() => deleteVehicle(v.id)}
                  className="text-xs font-medium px-3 py-1.5 transition-colors hover:bg-[#faeaea]"
                  style={{
                    background: '#fdf2f2', color: '#c0392b',
                    border: '0.5px solid #f0b8b8', borderRadius: '2px',
                    cursor: 'pointer',
                  }}
                >
                  Borrar
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

/* ── Icons ── */
const CameraIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);