import React, { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { LiveMap } from '@/components/LiveMap';
import type { Ride } from '@/types';

export const RidesPage: React.FC = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(params.get('create') === 'true');
  const [viewRide, setViewRide] = useState<Ride | null>(null);
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

  const loadRides = async () => {
    setLoading(true);
    try {
      const p: Record<string, string> = { status: 'PUBLISHED' };
      if (filters.originZone) p.originZone = filters.originZone;
      if (filters.destinationZone) p.destinationZone = filters.destinationZone;
      if (filters.departureDate) p.departureDate = filters.departureDate;
      const res = await api.rides.list(p);
      setRides(res.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { loadRides(); }, []);

  useEffect(() => {
    const viewId = params.get('view');
    if (viewId) {
      api.rides.getById(viewId).then(r => setViewRide(r.data)).catch(() => {});
    }
  }, [params]);

  const handleMapClick = (lat: number, lng: number) => {
    if (selectMode === 'origin') {
      setFormData(prev => ({ ...prev, originLat: lat, originLng: lng }));
      setSelectMode(null);
    } else if (selectMode === 'destination') {
      setFormData(prev => ({ ...prev, destinationLat: lat, destinationLng: lng }));
      setSelectMode(null);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.rides.create({
        ...formData,
        availableSeats: parseInt(formData.availableSeats),
        pricePerSeat: parseFloat(formData.pricePerSeat),
      });
      setFeedback({ msg: '¡Viaje publicado correctamente!', type: 'success' });
      setShowCreate(false);
      setFormData({
        originZone: '', originDetail: '', destinationZone: '', destinationDetail: '',
        departureDate: '', departureTime: '', availableSeats: '3', pricePerSeat: '0',
        notes: '', rules: '',
        originLat: null, originLng: null, destinationLat: null, destinationLng: null,
      });
      loadRides();
    } catch (err: any) {
      setFeedback({ msg: err.message, type: 'error' });
    }
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

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    PUBLISHED:   { label: 'Disponible',  bg: '#f0faf4', color: '#2d7a4f' },
    FULL:        { label: 'Lleno',       bg: '#fdf8f0', color: '#8a6a2e' },
    IN_PROGRESS: { label: 'En curso',    bg: '#f0f4fa', color: '#2d4f7a' },
    COMPLETED:   { label: 'Completado',  bg: '#f0f4fa', color: '#2d4f7a' },
    CANCELLED:   { label: 'Cancelado',   bg: '#fdf2f2', color: '#c0392b' },
  };

  const inputClass = 'w-full px-3 py-2.5 border border-[#ccc] text-[#1a1a2e] text-sm bg-[#fafaf8] outline-none transition-colors duration-200 focus:border-[#1a1a2e] focus:bg-white placeholder-[#bbb]';
  const inputStyle = { borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .r-card { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; }
        .r-ride { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; padding:1.25rem; cursor:pointer; transition:border-color 0.2s; }
        .r-ride:hover { border-color:#1a1a2e; }
        .status-badge { font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; padding:3px 10px; border-radius:2px; white-space:nowrap; }
        .section-label { font-size:11px; font-weight:500; color:#6b6b6b; letter-spacing:0.1em; text-transform:uppercase; }
        .r-btn { padding:11px 22px; font-size:12px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; border:none; cursor:pointer; border-radius:2px; transition:background 0.2s; font-family:'DM Sans',sans-serif; }
        .r-btn-primary { background:#1a1a2e; color:#fff; }
        .r-btn-primary:hover { background:#2d2d4e; }
        .r-btn-secondary { background:#fafaf8; color:#1a1a2e; border:0.5px solid #d8d4cc; }
        .r-btn-secondary:hover { border-color:#1a1a2e; }
        .r-btn-gold { background:#c8a96e; color:#1a1a2e; }
        .r-btn-gold:hover { background:#d4b87a; }
        .r-btn-sm { padding:7px 14px; font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; border:0.5px solid; cursor:pointer; border-radius:2px; transition:all 0.2s; font-family:'DM Sans',sans-serif; background:transparent; }
        .pulse-line { background:#e8e4dc; border-radius:2px; animation:pulse 1.5s ease-in-out infinite; }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
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
            onClick={() => setShowCreate(!showCreate)}
            className={`r-btn shrink-0 ${showCreate ? 'r-btn-secondary' : 'r-btn-gold'}`}
          >
            {showCreate ? '✕ Cancelar' : '+ Publicar viaje'}
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
          <button
            onClick={() => setFeedback({ msg: '', type: '' })}
            className="ml-auto bg-transparent border-none cursor-pointer text-current opacity-50 hover:opacity-100 text-base"
          >✕</button>
        </div>
      )}

      {/* Crear viaje */}
      {showCreate && (
        <form onSubmit={handleCreate} className="r-card p-6 space-y-5">
          <div className="pb-4 border-b border-[#e8e4dc]">
            <p className="section-label">Nuevo viaje</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Zona origen *',    field: 'originZone',        type: 'text',   placeholder: 'Ej: Norte',             required: true  },
              { label: 'Detalle origen',   field: 'originDetail',      type: 'text',   placeholder: 'Dirección específica',  required: false },
              { label: 'Zona destino *',   field: 'destinationZone',   type: 'text',   placeholder: 'Ej: Universidad',       required: true  },
              { label: 'Detalle destino',  field: 'destinationDetail', type: 'text',   placeholder: 'Edificio, piso...',     required: false },
              { label: 'Fecha *',          field: 'departureDate',     type: 'date',   placeholder: '',                      required: true  },
              { label: 'Hora *',           field: 'departureTime',     type: 'time',   placeholder: '',                      required: true  },
              { label: 'Asientos *',       field: 'availableSeats',    type: 'number', placeholder: '3',                     required: true  },
              { label: 'Precio / persona', field: 'pricePerSeat',      type: 'number', placeholder: '0',                     required: false },
            ].map(({ label, field, type, placeholder, required }) => (
              <div key={field}>
                <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">{label}</label>
                <input
                  type={type}
                  className={inputClass}
                  style={inputStyle}
                  placeholder={placeholder}
                  required={required}
                  min={type === 'number' ? 0 : undefined}
                  value={(formData as any)[field]}
                  onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Notas</label>
            <input className={inputClass} style={inputStyle} placeholder="Info adicional..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-2">Reglas del viaje</label>
            <input className={inputClass} style={inputStyle} placeholder="Ej: Puntualidad, no fumar..." value={formData.rules} onChange={e => setFormData({ ...formData, rules: e.target.value })} />
          </div>

          {/* Map */}
          <div>
            <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase mb-3">Ubicación en el mapa (opcional)</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setSelectMode(selectMode === 'origin' ? null : 'origin')}
                className="r-btn-sm"
                style={{
                  background: selectMode === 'origin' ? '#f0faf4' : '#fafaf8',
                  color: selectMode === 'origin' ? '#2d7a4f' : '#6b6b6b',
                  borderColor: selectMode === 'origin' ? '#a8d5bc' : '#d8d4cc',
                }}
              >
                {formData.originLat ? `Origen: ${formData.originLat.toFixed(4)}, ${formData.originLng?.toFixed(4)}` : 'Marcar origen'}
              </button>
              <button
                type="button"
                onClick={() => setSelectMode(selectMode === 'destination' ? null : 'destination')}
                className="r-btn-sm"
                style={{
                  background: selectMode === 'destination' ? '#f0f4fa' : '#fafaf8',
                  color: selectMode === 'destination' ? '#2d4f7a' : '#6b6b6b',
                  borderColor: selectMode === 'destination' ? '#a8bcd5' : '#d8d4cc',
                }}
              >
                {formData.destinationLat ? `Destino: ${formData.destinationLat.toFixed(4)}, ${formData.destinationLng?.toFixed(4)}` : 'Marcar destino'}
              </button>
            </div>
            <LiveMap
              origin={formData.originLat ? { lat: formData.originLat, lng: formData.originLng!, label: formData.originZone } : null}
              destination={formData.destinationLat ? { lat: formData.destinationLat, lng: formData.destinationLng!, label: formData.destinationZone } : null}
              onMapClick={handleMapClick}
              selectMode={selectMode}
              height="300px"
            />
          </div>

          <button type="submit" className="r-btn r-btn-primary">Publicar viaje</button>
        </form>
      )}

      {/* Filtros */}
      <div className="r-card p-5">
        <p className="section-label mb-4">Filtrar viajes</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className={inputClass} style={inputStyle} placeholder="Zona origen" value={filters.originZone} onChange={e => setFilters({ ...filters, originZone: e.target.value })} />
          <input className={inputClass} style={inputStyle} placeholder="Zona destino" value={filters.destinationZone} onChange={e => setFilters({ ...filters, destinationZone: e.target.value })} />
          <input type="date" className={inputClass} style={inputStyle} value={filters.departureDate} onChange={e => setFilters({ ...filters, departureDate: e.target.value })} />
          <button onClick={loadRides} className="r-btn r-btn-primary">Buscar</button>
        </div>
      </div>

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
                  <span className="status-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#999] text-xs">
                  <span>{ride.departureDate}</span>
                  <span>{ride.departureTime}</span>
                  <span>{ride.availableSeats} asientos</span>
                  {ride.pricePerSeat > 0 && (
                    <span className="text-[#c8a96e] font-medium">${ride.pricePerSeat.toLocaleString()}</span>
                  )}
                  {ride.originLat && <span className="text-[#2d7a4f]">GPS</span>}
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
              {/* Route */}
              <div className="flex items-center gap-2 text-[#1a1a2e] font-medium text-sm">
                <span style={{ color: '#c8a96e', fontSize: 12 }}>●</span>
                {viewRide.originZone}
                <span className="text-[#ccc] text-xs">→</span>
                {viewRide.destinationZone}
              </div>
              {viewRide.originDetail && (
                <p className="text-[#999] text-xs ml-4">{viewRide.originDetail} → {viewRide.destinationDetail}</p>
              )}

              {/* Details */}
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
                  destination={viewRide.destinationLat && viewRide.destinationLng ? { lat: viewRide.destinationLat, lng: viewRide.destinationLng, label: viewRide.destinationZone } : null}
                  height="200px"
                />
              )}

              {viewRide.driverId !== user?.id && viewRide.status === 'PUBLISHED' && (
                <div className="space-y-3 pt-2">
                  <input
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Mensaje para el conductor (opcional)"
                    value={requestMsg}
                    onChange={e => setRequestMsg(e.target.value)}
                  />
                  <button
                    onClick={() => handleRequestJoin(viewRide.id)}
                    className="r-btn r-btn-gold w-full"
                  >
                    Solicitar unirme
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Inline SVG icon ── */
const RoadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l3-10 3 10M15 17l3-10 3 10M9 7h6"/>
  </svg>
);