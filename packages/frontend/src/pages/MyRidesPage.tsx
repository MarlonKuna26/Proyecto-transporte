import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Ride, RideRequest } from '@/types';

export const MyRidesPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<Record<string, RideRequest[]>>({});
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.rides.myRides({});
        setRides(res.data || []);
      } catch { }
      setLoading(false);
    };
    load();
  }, []);

  const loadRequests = async (rideId: string) => {
    if (requests[rideId]) { setRequests(prev => { const n = { ...prev }; delete n[rideId]; return n; }); return; }
    try {
      const res = await api.rideRequests.byRide(rideId);
      setRequests(prev => ({ ...prev, [rideId]: res.data || [] }));
    } catch { }
  };

  const handleResponse = async (requestId: string, rideId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') await api.rideRequests.accept(requestId);
      else await api.rideRequests.reject(requestId);
      setFeedback(`Solicitud ${action === 'accept' ? 'aceptada' : 'rechazada'}`);
      loadRequests(rideId);
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  const cancelRide = async (rideId: string) => {
    try {
      await api.rides.cancel(rideId);
      setRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'CANCELLED' as const } : r));
      setFeedback('Viaje cancelado');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  const statusColor: Record<string, string> = { PUBLISHED: 'badge-success', FULL: 'badge-warning', IN_PROGRESS: 'badge-info', COMPLETED: 'badge-info', CANCELLED: 'badge-danger' };
  const statusLabel: Record<string, string> = { PUBLISHED: 'Activo', FULL: 'Lleno', IN_PROGRESS: 'En curso', COMPLETED: 'Completado', CANCELLED: 'Cancelado' };
  const reqStatusColor: Record<string, string> = { PENDING: 'badge-warning', ACCEPTED: 'badge-success', REJECTED: 'badge-danger', CANCELLED: 'badge-danger' };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">📋 Mis viajes como conductor</h1>

      {feedback && <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm">✅ {feedback}</div>}

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="glass-card p-6 animate-pulse"><div className="h-4 bg-white/10 rounded w-3/4 mb-3" /></div>)}</div>
      ) : rides.length === 0 ? (
        <div className="glass-card p-12 text-center"><p className="text-5xl mb-4">🚗</p><p className="text-dark-300 text-lg">No has publicado viajes aún</p></div>
      ) : (
        <div className="space-y-4">
          {rides.map(ride => (
            <div key={ride.id} className="glass-card p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 text-white font-medium">
                  <span>📍</span> {ride.originZone} <span className="text-dark-500">→</span> {ride.destinationZone}
                </div>
                <div className="flex items-center gap-2">
                  <span className={statusColor[ride.status]}>{statusLabel[ride.status]}</span>
                  {ride.status === 'PUBLISHED' && <button onClick={() => cancelRide(ride.id)} className="text-red-400 hover:text-red-300 text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors">Cancelar</button>}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-dark-400 text-xs mb-3">
                <span>📅 {ride.departureDate}</span><span>🕐 {ride.departureTime}</span><span>💺 {ride.availableSeats} asientos</span>
                {ride.pricePerSeat > 0 && <span className="text-accent-400 font-bold">${ride.pricePerSeat.toLocaleString()}</span>}
              </div>
              <button onClick={() => loadRequests(ride.id)} className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
                {requests[ride.id] ? '▲ Ocultar solicitudes' : '▼ Ver solicitudes'}
              </button>

              {requests[ride.id] && (
                <div className="mt-3 space-y-2 p-3 rounded-xl bg-white/3">
                  {requests[ride.id].length === 0 ? (
                    <p className="text-dark-400 text-sm">No hay solicitudes</p>
                  ) : (
                    requests[ride.id].map(req => (
                      <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 rounded-lg bg-white/5">
                        <div>
                          <span className={reqStatusColor[req.status]}>{req.status}</span>
                          <span className="text-dark-300 text-xs ml-2">{req.seatsRequested} asiento(s)</span>
                          {req.message && <p className="text-dark-400 text-xs mt-1">💬 {req.message}</p>}
                        </div>
                        {req.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleResponse(req.id, ride.id, 'accept')} className="px-3 py-1.5 rounded-lg bg-accent-500/20 text-accent-400 text-xs font-medium hover:bg-accent-500/30 transition-colors">✅ Aceptar</button>
                            <button onClick={() => handleResponse(req.id, ride.id, 'reject')} className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors">❌ Rechazar</button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
