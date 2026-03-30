import React, { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
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
  const [formData, setFormData] = useState({
    originZone: '', originDetail: '', destinationZone: '', destinationDetail: '',
    departureDate: '', departureTime: '', availableSeats: '3', pricePerSeat: '0',
    notes: '', rules: '',
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

  const statusColor: Record<string, string> = { PUBLISHED: 'badge-success', FULL: 'badge-warning', COMPLETED: 'badge-info', CANCELLED: 'badge-danger' };
  const statusLabel: Record<string, string> = { PUBLISHED: 'Disponible', FULL: 'Lleno', IN_PROGRESS: 'En curso', COMPLETED: 'Completado', CANCELLED: 'Cancelado' };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-navy-900">🚗 Viajes disponibles</h1>
        <button onClick={() => setShowCreate(!showCreate)} className={showCreate ? 'btn-secondary' : 'btn-primary'}>
          {showCreate ? '✖ Cancelar' : '➕ Publicar viaje'}
        </button>
      </div>

      {feedback.msg && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-primary-50 border border-primary-200 text-primary-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <span>{feedback.type === 'success' ? '✅' : '❌'}</span> {feedback.msg}
          <button onClick={() => setFeedback({ msg: '', type: '' })} className="ml-auto text-dark-400 hover:text-navy-900">✕</button>
        </div>
      )}

      {/* Crear viaje */}
      {showCreate && (
        <form onSubmit={handleCreate} className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-navy-900 mb-2">📍 Nuevo viaje</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-dark-500 mb-1">Zona origen *</label><input className="input-field" value={formData.originZone} onChange={e => setFormData({ ...formData, originZone: e.target.value })} required placeholder="Ej: Norte" /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Detalle origen</label><input className="input-field" value={formData.originDetail} onChange={e => setFormData({ ...formData, originDetail: e.target.value })} placeholder="Dirección específica" /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Zona destino *</label><input className="input-field" value={formData.destinationZone} onChange={e => setFormData({ ...formData, destinationZone: e.target.value })} required placeholder="Ej: Universidad" /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Detalle destino</label><input className="input-field" value={formData.destinationDetail} onChange={e => setFormData({ ...formData, destinationDetail: e.target.value })} placeholder="Edificio, piso..." /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Fecha *</label><input type="date" className="input-field" value={formData.departureDate} onChange={e => setFormData({ ...formData, departureDate: e.target.value })} required /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Hora *</label><input type="time" className="input-field" value={formData.departureTime} onChange={e => setFormData({ ...formData, departureTime: e.target.value })} required /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Asientos disponibles *</label><input type="number" min="1" max="8" className="input-field" value={formData.availableSeats} onChange={e => setFormData({ ...formData, availableSeats: e.target.value })} required /></div>
            <div><label className="block text-sm text-dark-500 mb-1">Precio/persona ($)</label><input type="number" min="0" step="100" className="input-field" value={formData.pricePerSeat} onChange={e => setFormData({ ...formData, pricePerSeat: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm text-dark-500 mb-1">Notas</label><input className="input-field" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Info adicional..." /></div>
          <button type="submit" className="btn-accent w-full md:w-auto">🚀 Publicar viaje</button>
        </form>
      )}

      {/* Filtros */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="input-field" placeholder="🔍 Zona origen" value={filters.originZone} onChange={e => setFilters({ ...filters, originZone: e.target.value })} />
          <input className="input-field" placeholder="📍 Zona destino" value={filters.destinationZone} onChange={e => setFilters({ ...filters, destinationZone: e.target.value })} />
          <input type="date" className="input-field" value={filters.departureDate} onChange={e => setFilters({ ...filters, departureDate: e.target.value })} />
          <button onClick={loadRides} className="btn-primary">Buscar</button>
        </div>
      </div>

      {/* Rides list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (<div key={i} className="glass-card p-6 animate-pulse"><div className="h-4 bg-dark-200 rounded w-3/4 mb-3" /><div className="h-3 bg-dark-200 rounded w-1/2" /></div>))}
        </div>
      ) : rides.length === 0 ? (
        <div className="glass-card p-12 text-center"><p className="text-5xl mb-4">🛣️</p><p className="text-dark-500 text-lg">No se encontraron viajes</p><p className="text-dark-400 text-sm mt-2">Prueba con otra zona o fecha, o publica uno nuevo</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rides.map(ride => (
            <div key={ride.id} onClick={() => setViewRide(ride)} className="glass-card p-5 card-hover cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 text-navy-900 font-medium">
                    <span>📍</span> {ride.originZone} <span className="text-dark-400">→</span> {ride.destinationZone}
                  </div>
                  {ride.originDetail && <p className="text-dark-400 text-xs mt-0.5 ml-6">{ride.originDetail}</p>}
                </div>
                <span className={statusColor[ride.status] || 'badge-info'}>{statusLabel[ride.status] || ride.status}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-dark-500 text-xs">
                <span>📅 {ride.departureDate}</span><span>🕐 {ride.departureTime}</span><span>💺 {ride.availableSeats} asientos</span>
                {ride.pricePerSeat > 0 && <span className="text-primary-600 font-semibold">${ride.pricePerSeat.toLocaleString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View ride modal */}
      {viewRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm" onClick={() => setViewRide(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-card-hover p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-navy-900">Detalle del viaje</h2>
              <button onClick={() => setViewRide(null)} className="text-dark-400 hover:text-navy-900 text-2xl">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-navy-900"><span className="text-lg">📍</span><span className="font-medium">{viewRide.originZone}</span><span className="text-dark-400">→</span><span className="font-medium">{viewRide.destinationZone}</span></div>
              {viewRide.originDetail && <p className="text-dark-500 ml-7">{viewRide.originDetail} → {viewRide.destinationDetail}</p>}
              <div className="flex flex-wrap gap-4 text-dark-500">
                <span>📅 {viewRide.departureDate}</span><span>🕐 {viewRide.departureTime}</span>
                <span>💺 {viewRide.availableSeats} asientos</span>
                {viewRide.pricePerSeat > 0 && <span className="text-primary-600 font-bold">${viewRide.pricePerSeat.toLocaleString()}/persona</span>}
              </div>
              {viewRide.notes && <div className="p-3 rounded-xl bg-primary-50"><span className="text-dark-500">📝 </span><span className="text-dark-600">{viewRide.notes}</span></div>}
              {viewRide.rules && <div className="p-3 rounded-xl bg-primary-50"><span className="text-dark-500">📋 </span><span className="text-dark-600">{viewRide.rules}</span></div>}
            </div>

            {viewRide.driverId !== user?.id && viewRide.status === 'PUBLISHED' && (
              <div className="mt-6 space-y-3">
                <input className="input-field" placeholder="Mensaje para el conductor (opcional)" value={requestMsg} onChange={e => setRequestMsg(e.target.value)} />
                <button onClick={() => handleRequestJoin(viewRide.id)} className="btn-accent w-full">🤝 Solicitar unirme</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
