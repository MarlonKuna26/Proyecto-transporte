import React, { useEffect, useState, FormEvent } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { UserProfile, Vehicle, Rating } from '@/types';
import { ESTRUCTURA_UTA, ZONAS_AMBATO, VEHICULO_DATA } from '@/constants';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
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

  // Calcula el porcentaje de completitud del perfil en base a campos clave
  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.career,
      profile.phone,
      profile.zone,
      profile.neighborhood,
      profile.emergencyContact,
      profile.emergencyPhone,
      profile.photoUrl
    ];
    const filled = fields.filter(f => f && f.trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

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

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setVehicleForm({
      plate: vehicle.plate || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      color: vehicle.color || '',
      capacity: vehicle.capacity.toString() || '4',
      year: vehicle.year?.toString() || '',
      photoUrl: vehicle.photoUrl || ''
    });
    setShowVehicleForm(true);
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
      await refreshUser();
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

  const renderStars = (score: any) => {
    const val = parseFloat(score);
    const rounded = isNaN(val) ? 5 : Math.round(val);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={i < rounded ? '#FBBF24' : 'none'}
            stroke={i < rounded ? '#FBBF24' : '#D1D5DB'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    );
  };

  const inputClass = 'w-full px-3 py-2 border border-zinc-200 bg-zinc-50 rounded-lg text-sm text-black outline-none placeholder-zinc-400 focus:bg-white focus:border-black focus:ring-1 focus:ring-black/20 transition-all duration-150';

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[300px]">
      <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin mb-4" />
      <p className="text-zinc-500 text-sm font-medium animate-pulse">Cargando perfil...</p>
    </div>
  );

  const completionPercent = calculateCompletion();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ═══ FEEDBACK ALERTS (Premium Toast style) ═══ */}
      {feedback && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium shadow-sm mb-6 border transition-all`}
          style={{
            background: feedback.includes('actualizado') || feedback.includes('registrado') || feedback.includes('eliminado') ? '#ECFDF5' : '#FEF2F2',
            borderColor: feedback.includes('actualizado') || feedback.includes('registrado') || feedback.includes('eliminado') ? '#A7F3D0' : '#FCA5A5',
            color: feedback.includes('actualizado') || feedback.includes('registrado') || feedback.includes('eliminado') ? '#047857' : '#B91C1C'
          }}
        >
          {feedback.includes('actualizado') || feedback.includes('registrado') || feedback.includes('eliminado') ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          )}
          <span>{feedback}</span>
        </div>
      )}

      {/* ═══ PROFILE HEADER & BANNER ═══ */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-black to-zinc-800 relative" />
        
        <div className="px-6 pb-6 pt-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-5">
            {/* Circular Avatar */}
            <div className="relative -mt-12 shrink-0 z-10">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-zinc-200 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-zinc-700 select-none">
                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              {editMode && (
                <label className="absolute bottom-0 right-0 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow hover:bg-zinc-800 transition-colors duration-150" title="Cambiar foto">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>

            {/* Profile Summary info */}
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-black tracking-tight flex items-center gap-2">
                {profile?.name}
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">{profile?.email}</p>
              
              <div className="flex flex-wrap items-center gap-2.5 mt-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 bg-zinc-100 text-zinc-800 rounded">
                  {profile?.role === 'ADMIN' ? 'Administrador' : 'Estudiante'}
                </span>
                
                {profile?.isVerified && (
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100/60 rounded flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    Verificado
                  </span>
                )}
                
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100/50 px-2.5 py-0.5 rounded">
                  {renderStars(profile?.reputation || 5)}
                  <span className="text-[11px] font-bold text-amber-700">({ratings?.count || 0})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Edit Button */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-150 shrink-0 ${
              editMode 
                ? 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200' 
                : 'bg-black text-white hover:bg-zinc-800 active:scale-[0.98]'
            }`}
          >
            {editMode ? '✕ Cancelar' : 'Editar perfil'}
          </button>
        </div>
      </div>

      {/* ═══ PROFILE PROGRESS BAR (Wow factor) ═══ */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
          <div>
            <h3 className="text-sm font-bold text-black">Nivel de completitud de tu cuenta</h3>
            <p className="text-xs text-zinc-400">Un perfil completo genera mayor confianza y agiliza tus viajes.</p>
          </div>
          <span className="text-sm font-extrabold text-black shrink-0">{completionPercent}%</span>
        </div>
        <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${completionPercent}%`, backgroundColor: completionPercent === 100 ? '#10B981' : '#000000' }}
          />
        </div>
      </div>

      {/* ═══ TWO-COLUMN CONTENT GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Personal Info or Edit Form (span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Edit Form */}
          {editMode ? (
            <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-5">
              <div className="border-b border-zinc-100 pb-4">
                <h2 className="text-lg font-bold text-black">Editar Información Personal</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Mantén tus datos escolares y de contacto actualizados.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Nombre</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={editData.name || ''}
                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Facultad */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Facultad</label>
                  <select
                    className={inputClass}
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

                {/* Carrera (Anidado) */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Carrera</label>
                  <select
                    className={inputClass}
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

                {/* Zona de Residencia */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Zona de Residencia</label>
                  <select
                    className={inputClass}
                    value={editData.zone || ''}
                    onChange={e => setEditData({ ...editData, zone: e.target.value })}
                  >
                    <option value="">¿Por dónde vives?</option>
                    {ZONAS_AMBATO.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>

                {/* Barrio */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Barrio / Sector</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Ej: Ficoa Las Palmas"
                    value={editData.neighborhood || ''}
                    onChange={e => setEditData({ ...editData, neighborhood: e.target.value })}
                  />
                </div>

                {/* Teléfono Personal */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Teléfono Personal (Ecuador)</label>
                  <input
                    name="phone"
                    type="text"
                    className={inputClass}
                    placeholder="Ej: 0991234567"
                    value={editData.phone || ''}
                    onChange={handlePhoneInputChange}
                  />
                </div>

                {/* Contacto Emergencia */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Contacto de Emergencia (Nombre)</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Ej: Madre / Padre"
                    value={editData.emergencyContact || ''}
                    onChange={e => setEditData({ ...editData, emergencyContact: e.target.value })}
                  />
                </div>

                {/* Teléfono Emergencia */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Teléfono Emergencia (Ecuador)</label>
                  <input
                    name="emergencyPhone"
                    type="text"
                    className={inputClass}
                    placeholder="Ej: 0991234567"
                    value={editData.emergencyPhone || ''}
                    onChange={handlePhoneInputChange}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-black text-white hover:bg-zinc-800 text-sm font-semibold py-2.5 px-4 rounded-lg active:scale-[0.99] transition-all duration-150">
                  Guardar Cambios
                </button>
              </div>
            </form>
          ) : (
            /* Personal Info Display */
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6 space-y-6">
              <div className="border-b border-zinc-100 pb-4">
                <h2 className="text-lg font-bold text-black">Información de la Cuenta</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Datos académicos y de contacto registrados.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    label: 'Carrera Universitaria',
                    value: profile?.career,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                  },
                  {
                    label: 'Celular de Contacto',
                    value: profile?.phone,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  },
                  {
                    label: 'Zona de Residencia',
                    value: profile?.zone,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  },
                  {
                    label: 'Barrio / Sector',
                    value: profile?.neighborhood,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  },
                  {
                    label: 'Contacto de Emergencia',
                    value: profile?.emergencyContact,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  },
                  {
                    label: 'Tel. de Emergencia',
                    value: profile?.emergencyPhone,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 rounded-xl hover:bg-zinc-50 transition-colors duration-150">
                    <div className="shrink-0 text-zinc-400 mt-0.5">{item.icon}</div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.label}</p>
                      <p className="text-sm font-semibold text-black mt-1">
                        {item.value || (
                          <span className="text-zinc-300 italic font-normal">Sin registrar</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Vehicles & Ratings (span 1) */}
        <div className="space-y-6">

          {/* ═══ VEHICLES SECTION ═══ */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-black">Mis Vehículos</h2>
                <p className="text-[10px] text-zinc-400">Registrados para ofertar viajes.</p>
              </div>
              <button
                onClick={() => setShowVehicleForm(!showVehicleForm)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                  showVehicleForm
                    ? 'bg-zinc-50 border-zinc-200 text-zinc-800'
                    : 'bg-black border-black text-white hover:bg-zinc-800'
                }`}
              >
                {showVehicleForm ? '✕ Cancelar' : '+ Agregar'}
              </button>
            </div>

            {/* Vehicle Registration Form */}
            {showVehicleForm && (
              <form onSubmit={handleVehicleSubmit} className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 mb-4 space-y-3.5 animate-fade-in">
                <p className="text-xs font-bold text-black mb-1 border-b border-zinc-200/60 pb-1">
                  {editingVehicleId ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {/* Placa */}
                  <div className="col-span-1">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1 ml-0.5">Placa (ABC-1234)</label>
                    <input
                      name="plate"
                      className={inputClass}
                      placeholder="ABC-1234"
                      required
                      value={vehicleForm.plate}
                      onChange={handleVehicleInputChange}
                    />
                  </div>

                  {/* Marca */}
                  <div className="col-span-1">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1 ml-0.5">Marca</label>
                    <select
                      name="brand"
                      className={inputClass}
                      required
                      value={vehicleForm.brand}
                      onChange={handleVehicleInputChange}
                    >
                      <option value="">Selecciona</option>
                      {VEHICULO_DATA.marcas.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Modelo */}
                  <div className="col-span-1">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1 ml-0.5">Modelo</label>
                    <input
                      name="model"
                      className={inputClass}
                      placeholder="Ej: Aveo"
                      required
                      value={vehicleForm.model}
                      onChange={handleVehicleInputChange}
                    />
                  </div>

                  {/* Color */}
                  <div className="col-span-1">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1 ml-0.5">Color</label>
                    <select
                      name="color"
                      className={inputClass}
                      required
                      value={vehicleForm.color}
                      onChange={handleVehicleInputChange}
                    >
                      <option value="">Selecciona</option>
                      {VEHICULO_DATA.colores.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Capacidad */}
                  <div className="col-span-1">
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1 ml-0.5">Asientos (Máx 45)</label>
                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      max="45"
                      className={inputClass}
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
                    <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1 ml-0.5">Año</label>
                    <input
                      name="year"
                      type="number"
                      className={inputClass}
                      placeholder="2024"
                      value={vehicleForm.year}
                      onChange={handleVehicleInputChange}
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-black text-white hover:bg-zinc-800 text-xs font-semibold py-2 px-3 rounded-lg transition-all duration-150">
                  {editingVehicleId ? 'Guardar Cambios' : 'Registrar Vehículo'}
                </button>
              </form>
            )}

            {/* Vehicles list */}
            {vehicles.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" className="mx-auto mb-2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                <p className="text-xs text-zinc-400 font-medium">No tienes vehículos registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map(v => (
                  <div key={v.id} className="border border-zinc-200/80 rounded-xl p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-zinc-300 transition-colors duration-150">
                    <div className="flex items-center gap-3">
                      {/* Premium Realistic Car Plate Visual */}
                      <div className="relative shrink-0 w-24 h-12 bg-white border-2 border-zinc-400 rounded-md shadow-sm overflow-hidden flex items-center justify-center">
                        {/* Plate Blue Indicator Band (realistic detail) */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 flex flex-col items-center justify-between py-0.5">
                          <span className="text-[3px] text-white font-bold tracking-tighter leading-none select-none">EC</span>
                        </div>
                        {/* Plate alphanumeric text */}
                        <span className="text-xs font-mono font-extrabold text-zinc-800 pl-1.5 tracking-wider select-none">
                          {v.plate}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-black truncate">
                          {v.brand} {v.model}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {v.color} · {v.capacity} asientos {v.year ? `· ${v.year}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 justify-end shrink-0">
                      <button
                        onClick={() => handleEditVehicle(v)}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-all cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteVehicle(v.id)}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ RATINGS SECTION ═══ */}
          {ratings && ratings.ratings.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-6">
              <h2 className="text-base font-extrabold text-black border-b border-zinc-100 pb-4 mb-4">
                Calificaciones Recibidas
              </h2>

              {/* Score summary panel */}
              <div className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-xl mb-4">
                <span className="text-3xl font-black text-black tracking-tighter">
                  {(() => {
                    const avg = parseFloat(ratings.average as any);
                    return isNaN(avg) ? '5.0' : avg.toFixed(1);
                  })()}
                </span>
                <div>
                  <div className="flex items-center">{renderStars(ratings.average)}</div>
                  <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                    {ratings.count} calificaciones en total
                  </p>
                </div>
              </div>

              {/* Ratings Feed */}
              <div className="space-y-3 max-h-[250px] overflow-y-auto scrollbar-hide pr-1">
                {ratings.ratings.slice(0, 8).map(r => (
                  <div key={r.id} className="border border-zinc-100 rounded-xl p-3 bg-zinc-50/50 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                        {r.roleInRide === 'DRIVER' ? 'Pasajero → Conductor' : 'Conductor → Pasajero'}
                      </span>
                      <div className="flex items-center">{renderStars(r.score)}</div>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-zinc-600 font-medium italic leading-relaxed">
                        "{r.comment}"
                      </p>
                    )}
                    <p className="text-[9px] text-zinc-400 text-right">
                      {new Date(r.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};