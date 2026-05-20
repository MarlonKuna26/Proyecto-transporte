import React, { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { LiveMap } from '@/components/LiveMap';
import type { Ride, RideRequest, UserProfile } from '@/types';
import { ZONAS_AMBATO, CAMPUS_UTA } from '@/constants';

export const RidesPage: React.FC = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(params.get('create') === 'true');
  const [viewRide, setViewRide] = useState<Ride | null>(null);

  const [editRideId, setEditRideId] = useState<string | null>(null);
  const isEditing = !!editRideId;

  const [requestMsg, setRequestMsg] = useState('');
  const [filters, setFilters] = useState({ originZone: '', destinationZone: '', departureDate: '' });
  const [feedback, setFeedback] = useState({ msg: '', type: '' });
  const [selectMode, setSelectMode] = useState<'origin' | 'destination' | null>(null);

  const [formData, setFormData] = useState({
    originZone: '', originDetail: '', destinationZone: '', destinationDetail: '',
    departureDate: '', departureTime: '', availableSeats: '3', pricePerSeat: '0',
    notes: '', rules: '',
    originLat: null as number | null, originLng: null as number | null,
    destinationLat: null as number | null, destinationLng: null as number | null,
  });

  const [acceptedUsers, setAcceptedUsers] = useState<UserProfile[]>([]);
  const [loadingAccepted, setLoadingAccepted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  /* ===== LOAD ===== */
  const loadRides = async () => {
    setLoading(true);
    try {
      const res = await api.rides.list({ status: 'PUBLISHED' });
      setRides(res.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { loadRides(); }, []);

  useEffect(() => {
    const fetchAccepted = async () => {
      if (!viewRide) { setAcceptedUsers([]); return; }
      setLoadingAccepted(true);
      try {
        const res = await api.rideRequests.byRide(viewRide.id);
        const accepted: RideRequest[] = (res.data || []).filter((r: RideRequest) => r.status === 'ACCEPTED');
        const profiles: UserProfile[] = [];
        for (const req of accepted) {
          try {
            const userRes = await api.users.getProfile(req.passengerId);
            if (userRes.data) profiles.push(userRes.data);
          } catch {}
        }
        setAcceptedUsers(profiles);
      } catch { setAcceptedUsers([]); }
      setLoadingAccepted(false);
    };
    fetchAccepted();
  }, [viewRide]);

  /* ===== CREATE ===== */
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.rides.create({
        ...formData,
        availableSeats: parseInt(formData.availableSeats),
        pricePerSeat: parseFloat(formData.pricePerSeat),
      });
      setFeedback({ msg: '¡Viaje publicado!', type: 'success' });
      resetForm();
      loadRides();
    } catch (err: any) {
      setFeedback({ msg: err.message, type: 'error' });
    }
  };

  /* ===== UPDATE ===== */
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editRideId) return;
    try {
      await api.rides.update(editRideId, {
        ...formData,
        availableSeats: parseInt(formData.availableSeats),
        pricePerSeat: parseFloat(formData.pricePerSeat),
      });
      setFeedback({ msg: '¡Viaje actualizado!', type: 'success' });
      resetForm();
      loadRides();
    } catch (err: any) {
      setFeedback({ msg: err.message, type: 'error' });
    }
  };

  /* ===== EDIT ===== */
  const handleEdit = (ride: Ride) => {
    setEditRideId(ride.id);
    setShowCreate(true);
    setFormData({
      originZone: ride.originZone,
      originDetail: ride.originDetail || '',
      destinationZone: ride.destinationZone,
      destinationDetail: ride.destinationDetail || '',
      departureDate: ride.departureDate,
      departureTime: ride.departureTime,
      availableSeats: ride.availableSeats.toString(),
      pricePerSeat: ride.pricePerSeat.toString(),
      notes: ride.notes || '',
      rules: ride.rules || '',
      originLat: ride.originLat ?? null,
      originLng: ride.originLng ?? null,
      destinationLat: ride.destinationLat ?? null,
      destinationLng: ride.destinationLng ?? null,
    });
  };

  /* ===== RESET ===== */
  const resetForm = () => {
    setEditRideId(null);
    setShowCreate(false);
    setFormData({
      originZone: '', originDetail: '', destinationZone: '', destinationDetail: '',
      departureDate: '', departureTime: '', availableSeats: '3', pricePerSeat: '0',
      notes: '', rules: '',
      originLat: null, originLng: null,
      destinationLat: null, destinationLng: null,
    });
  };

  const handleRequestJoin = async (rideId: string) => {
    try {
      await api.rideRequests.create({ rideId, message: requestMsg || null, seatsRequested: 1 });
      setFeedback({ msg: '¡Solicitud enviada!', type: 'success' });
      setViewRide(null);
      setRequestMsg('');
    } catch (err: any) {
      setFeedback({ msg: err.message, type: 'error' });
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    try {
      await api.rides.cancel(rideId);
      setFeedback({ msg: 'Viaje eliminado correctamente.', type: 'success' });
      setConfirmDelete(null);
      setViewRide(null);
      loadRides();
    } catch (err: any) {
      setFeedback({ msg: err.message || 'Error al eliminar el viaje.', type: 'error' });
      setConfirmDelete(null);
    }
  };

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    PUBLISHED:   { label: 'Disponible', bg: '#f0faf4', color: '#2d7a4f' },
    FULL:        { label: 'Lleno',      bg: '#fdf8f0', color: '#8a6a2e' },
    IN_PROGRESS: { label: 'En curso',   bg: '#f0f4fa', color: '#2d4f7a' },
    COMPLETED:   { label: 'Completado', bg: '#f0f4fa', color: '#2d4f7a' },
    CANCELLED:   { label: 'Cancelado',  bg: '#fdf2f2', color: '#c0392b' },
  };

  const inputClass = 'w-full px-3 py-2.5 border border-[#ccc] text-[#1a1a2e] text-sm bg-[#fafaf8] outline-none transition-colors duration-200 focus:border-[#1a1a2e] focus:bg-white placeholder-[#bbb]';
  const inputStyle = { borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" };
  const selectStyle = {
    ...inputStyle,
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .r-card { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; }
        .r-ride { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; padding:1.25rem; cursor:pointer; transition:border-color 0.2s; }
        .r-ride:hover { border-color:#1a1a2e; }
        .status-badge { font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; padding:3px 10px; border-radius:2px; white-space:nowrap; }
        .section-label { font-size:11px; font-weight:500; color:#6b6b6b; letter-spacing:0.1em; text-transform:uppercase; }
        .r-btn { padding:11px 22px; font-size:12px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; border:none; cursor:pointer; border-radius:2px; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        .r-btn-primary { background:#1a1a2e; color:#fff; }
        .r-btn-primary:hover { background:#2d2d4e; }
        .r-btn-secondary { background:#fafaf8; color:#1a1a2e; }
        .r-btn-secondary:hover { border-color:#1a1a2e !important; }
        .r-btn-gold { background:#c8a96e; color:#1a1a2e; }
        .r-btn-gold:hover { background:#d4b87a; }
        .r-btn-edit { background:#fafaf8; color:#6b6b6b; border:0.5px solid #d8d4cc; padding:5px 12px; font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; cursor:pointer; border-radius:2px; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        .r-btn-edit:hover { border-color:#c8a96e; color:#c8a96e; }
        .r-btn-danger { background:#fdf2f2; color:#c0392b; border:0.5px solid #f0b8b8; padding:10px 18px; font-size:12px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; cursor:pointer; border-radius:2px; transition:all 0.2s; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:6px; }
        .r-btn-danger:hover { background:#fce8e8; border-color:#c0392b; }
        .pulse-line { background:#e8e4dc; border-radius:2px; animation:pulse 1.5s ease-in-out infinite; }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        optgroup { font-size:11px; color:#999; letter-spacing:0.06em; text-transform:uppercase; }
        .user-avatar { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:0.5px solid #f0ece4; }
        .user-avatar:last-child { border-bottom:none; }
      `}</style>

      {/* Page header */}
      <div className="r-card overflow-hidden">
        <div className="bg-[#1a1a2e] px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl text-white tracking-wide" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
              Viajes disponibles
            </h1>
            <p className="text-[#8a8fa8] text-xs tracking-widest uppercase mt-1">
              Encuentra o publica un viaje · U-Ride
            </p>
          </div>
          <button
            onClick={() => { if (showCreate) resetForm(); else setShowCreate(true); }}
            className={`r-btn shrink-0 ${showCreate ? 'r-btn-secondary' : 'r-btn-gold'}`}
            style={showCreate ? { border: '0.5px solid #d8d4cc' } : {}}
          >
            {showCreate ? '✕ Cancelar' : '+ Nuevo viaje'}
          </button>
        </div>
        <div className="w-full h-px bg-[#c8a96e] opacity-40" />
      </div>

      {/* Feedback */}
      {feedback.msg && (
        <div
          className="flex items-center gap-3 px-4 py-3 text-sm"
          style={{
            background: feedback.type === 'success' ? '#f0faf4' : '#fdf2f2',
            borderLeft: `3px solid ${feedback.type === 'success' ? '#2d7a4f' : '#c0392b'}`,
            color: feedback.type === 'success' ? '#2d7a4f' : '#c0392b',
            borderRadius: '0 2px 2px 0',
          }}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback({ msg: '', type: '' })} className="ml-auto bg-transparent border-none cursor-pointer text-current opacity-50 hover:opacity-100 text-base">✕</button>
        </div>
      )}

      {/* Form: crear / editar */}
      {showCreate && (
        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="r-card p-6 space-y-5">
          <div className="pb-4 border-b border-[#e8e4dc] flex items-center justify-between">
            <p className="section-label">{isEditing ? 'Editar viaje' : 'Nuevo viaje'}</p>
            {isEditing && (
              <span className="text-xs px-2.5 py-1 font-medium" style={{ background: '#fdf8f0', color: '#8a6a2e', border: '0.5px solid #e8d5b0', borderRadius: '2px' }}>
                Modo edición
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Zona origen *</label>
              <select className={inputClass} style={selectStyle} required value={formData.originZone}
                onChange={e => setFormData({ ...formData, originZone: e.target.value })}>
                <option value="">Seleccionar zona</option>
                <optgroup label="Campus UTA">
                  {CAMPUS_UTA.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
                <optgroup label="Zonas Ambato">
                  {ZONAS_AMBATO.map(z => <option key={z} value={z}>{z}</option>)}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Zona destino *</label>
              <select className={inputClass} style={selectStyle} required value={formData.destinationZone}
                onChange={e => setFormData({ ...formData, destinationZone: e.target.value })}>
                <option value="">Seleccionar zona</option>
                <optgroup label="Campus UTA">
                  {CAMPUS_UTA.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
                <optgroup label="Zonas Ambato">
                  {ZONAS_AMBATO.map(z => <option key={z} value={z}>{z}</option>)}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Fecha *</label>
              <input type="date" className={inputClass} style={inputStyle} required
                value={formData.departureDate} onChange={e => setFormData({ ...formData, departureDate: e.target.value })} />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Hora *</label>
              <input type="time" className={inputClass} style={inputStyle} required
                value={formData.departureTime} onChange={e => setFormData({ ...formData, departureTime: e.target.value })} />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Asientos disponibles *</label>
              <input type="number" min="1" max="8" className={inputClass} style={inputStyle}
                value={formData.availableSeats} onChange={e => setFormData({ ...formData, availableSeats: e.target.value })} />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Precio / persona ($)</label>
              <input type="number" min="0" step="0.50" className={inputClass} style={inputStyle}
                value={formData.pricePerSeat} onChange={e => setFormData({ ...formData, pricePerSeat: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Notas</label>
            <input className={inputClass} style={inputStyle} placeholder="Info adicional..."
              value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Reglas del viaje</label>
            <input className={inputClass} style={inputStyle} placeholder="Ej: Puntualidad, no fumar..."
              value={formData.rules} onChange={e => setFormData({ ...formData, rules: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="r-btn r-btn-primary">
              {isEditing ? 'Actualizar viaje' : 'Publicar viaje'}
            </button>
            <button type="button" onClick={resetForm} className="r-btn r-btn-secondary" style={{ border: '0.5px solid #d8d4cc' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Rides list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="r-card p-6">
              <div className="pulse-line h-3 w-3/4 mb-3" />
              <div className="pulse-line h-2.5 w-1/2" />
            </div>
          ))}
        </div>
      ) : rides.length === 0 ? (
        <div className="r-card p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#fdf8f0] mb-4" style={{ borderRadius: '2px' }}>
            <RoadIcon />
          </div>
          <p className="text-[#999] text-sm">No se encontraron viajes</p>
          <p className="text-[#bbb] text-xs mt-1">Prueba con otra zona o fecha, o publica uno nuevo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rides.map(ride => {
            const s = statusConfig[ride.status] || statusConfig.IN_PROGRESS;
            return (
              <div key={ride.id} className="r-ride" onClick={() => setViewRide(ride)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 text-[#1a1a2e] font-medium text-sm">
                      <span style={{ color: '#c8a96e', fontSize: 12 }}>●</span>
                      {ride.originZone}
                      <span className="text-[#ccc] text-xs">→</span>
                      {ride.destinationZone}
                    </div>
                    {ride.originDetail && (
                      <p className="text-[#bbb] text-xs mt-0.5 ml-4">{ride.originDetail}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {ride.driverId === user?.id && (
                      <button className="r-btn-edit" onClick={() => handleEdit(ride)}>Editar</button>
                    )}
                    <span className="status-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#999] text-xs">
                  <span>{ride.departureDate}</span>
                  <span>{ride.departureTime}</span>
                  <span>{ride.availableSeats} asientos</span>
                  {ride.pricePerSeat > 0 && (
                    <span className="text-[#c8a96e] font-medium">${ride.pricePerSeat.toLocaleString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View ride modal */}
      {viewRide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(26,26,46,0.55)' }}
          onClick={() => setViewRide(null)}
        >
          <div
            className="w-full max-w-lg bg-white overflow-y-auto"
            style={{ borderRadius: '4px', maxHeight: '90vh', border: '0.5px solid #d8d4cc' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-[#1a1a2e] px-6 py-5 flex items-center justify-between">
              <h2 className="text-white text-lg tracking-wide" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
                Detalle del viaje
              </h2>
              <button
                onClick={() => setViewRide(null)}
                className="text-[#8a8fa8] hover:text-white transition-colors bg-transparent border-none cursor-pointer text-xl"
              >✕</button>
            </div>
            <div className="w-full h-px bg-[#c8a96e] opacity-40" />

            <div className="p-6 space-y-4">
              {/* Ruta */}
              <div className="flex items-center gap-2 text-[#1a1a2e] font-medium text-sm">
                <span style={{ color: '#c8a96e', fontSize: 12 }}>●</span>
                {viewRide.originZone}
                <span className="text-[#ccc] text-xs">→</span>
                {viewRide.destinationZone}
              </div>

              {/* Detalles */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[#999] text-xs py-2 border-t border-b border-[#e8e4dc]">
                <span>{viewRide.departureDate}</span>
                <span>{viewRide.departureTime}</span>
                <span>{viewRide.availableSeats} asientos</span>
                {viewRide.pricePerSeat > 0 && (
                  <span className="text-[#c8a96e] font-medium">${viewRide.pricePerSeat.toLocaleString()} / persona</span>
                )}
              </div>

              {viewRide.notes && (
                <div className="px-4 py-3 bg-[#fafaf8] border-l-2 border-[#c8a96e]">
                  <p className="text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-1">Notas</p>
                  <p className="text-[#555] text-sm">{viewRide.notes}</p>
                </div>
              )}

              {viewRide.rules && (
                <div className="px-4 py-3 bg-[#fafaf8] border-l-2 border-[#1a1a2e]">
                  <p className="text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-1">Reglas</p>
                  <p className="text-[#555] text-sm">{viewRide.rules}</p>
                </div>
              )}

              {viewRide.originLat && viewRide.originLng && (
                <LiveMap
                  origin={{ lat: viewRide.originLat, lng: viewRide.originLng, label: viewRide.originZone }}
                  destination={viewRide.destinationLat && viewRide.destinationLng
                    ? { lat: viewRide.destinationLat, lng: viewRide.destinationLng, label: viewRide.destinationZone }
                    : null}
                  height="200px"
                />
              )}

              {/* Usuarios aceptados */}
              <div>
                <p className="section-label mb-3">Pasajeros aceptados</p>
                {loadingAccepted ? (
                  <div className="pulse-line h-3 w-1/2" />
                ) : acceptedUsers.length === 0 ? (
                  <p className="text-[#bbb] text-xs">Ningún pasajero aceptado aún</p>
                ) : (
                  <div>
                    {acceptedUsers.map(u => (
                      <div key={u.userId} className="user-avatar">
                        {u.photoUrl ? (
                          <img
                            src={u.photoUrl}
                            alt={u.name}
                            style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #c8a96e' }}
                          />
                        ) : (
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%', background: '#fdf8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 500, color: '#c8a96e', border: '1.5px solid #e8d5b0',
                            fontSize: 13, fontFamily: "'Playfair Display', serif",
                          }}>
                            {u.name?.[0] || '?'}
                          </div>
                        )}
                        <span style={{ fontSize: 13, color: '#1a1a2e' }}>{u.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Solicitar unirse */}
              {viewRide.driverId !== user?.id && viewRide.status === 'PUBLISHED' && (
                <div className="space-y-3 pt-2">
                  <input
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Mensaje para el conductor (opcional)"
                    value={requestMsg}
                    onChange={e => setRequestMsg(e.target.value)}
                  />
                  <button onClick={() => handleRequestJoin(viewRide.id)} className="r-btn r-btn-gold w-full">
                    Solicitar unirme
                  </button>
                </div>
              )}

              {/* Eliminar viaje — solo conductor, al fondo separado */}
              {viewRide.driverId === user?.id && (
                <div className="pt-4 mt-2" style={{ borderTop: '0.5px solid #e8e4dc' }}>
                  
                  <button
                    className="r-btn-danger"
                    onClick={() => setConfirmDelete(viewRide.id)}
                  >
                    <TrashIcon />
                    Eliminar este viaje
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal confirmación eliminar */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(26,26,46,0.65)' }}
        >
          <div
            className="w-full max-w-sm bg-white overflow-hidden"
            style={{ borderRadius: '4px', border: '0.5px solid #d8d4cc' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#1a1a2e] px-6 py-5">
              <h3 className="text-white text-lg tracking-wide" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
                Eliminar viaje
              </h3>
              <p className="text-[#8a8fa8] text-xs tracking-widest uppercase mt-1">
                Acción irreversible
              </p>
            </div>
            <div className="w-full h-px" style={{ background: '#c0392b', opacity: 0.5 }} />

            {/* Body */}
            <div className="p-6">
              <div className="flex items-start gap-3 mb-5">
                <div
                  className="shrink-0 w-9 h-9 flex items-center justify-center"
                  style={{ background: '#fdf2f2', borderRadius: '2px', border: '0.5px solid #f0b8b8' }}
                >
                  <TrashIcon color="#c0392b" />
                </div>
                <div>
                  <p className="text-[#1a1a2e] text-sm font-medium mb-1">¿Confirmar eliminación?</p>
                  <p className="text-[#999] text-xs leading-relaxed">
                    Este viaje será cancelado permanentemente. Los pasajeros aceptados serán notificados y no podrás deshacer esta acción.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteRide(confirmDelete)}
                  className="r-btn-danger flex-1 justify-center"
                  style={{ padding: '11px 16px', fontSize: '12px' }}
                >
                  <TrashIcon color="#c0392b" />
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="r-btn r-btn-secondary flex-1"
                  style={{ border: '0.5px solid #d8d4cc', padding: '11px 16px' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── SVG icons ── */
const RoadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l3-10 3 10M15 17l3-10 3 10M9 7h6"/>
  </svg>
);

const TrashIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);