import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

  const startRide = async (rideId: string) => {
    try {
      await api.tracking.startRide(rideId);
      setRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'IN_PROGRESS' as const } : r));
      setFeedback('¡Viaje iniciado! Redirigiendo al seguimiento...');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  const completeRide = async (rideId: string) => {
    try {
      await api.tracking.completeRide(rideId);
      setRides(prev => prev.map(r => r.id === rideId ? { ...r, status: 'COMPLETED' as const } : r));
      setFeedback('¡Viaje completado!');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    PUBLISHED:   { bg: '#f0faf4', color: '#2d7a4f', label: 'Disponible' },
    FULL:        { bg: '#fdf8f0', color: '#8a6a2e', label: 'Lleno'      },
    IN_PROGRESS: { bg: '#f0f4fa', color: '#2d4f7a', label: 'En curso'   },
    COMPLETED:   { bg: '#f0f4fa', color: '#2d4f7a', label: 'Completado' },
    CANCELLED:   { bg: '#fdf2f2', color: '#c0392b', label: 'Cancelado'  },
  };

  const reqStatusStyle: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:   { bg: '#fdf8f0', color: '#8a6a2e', label: 'Pendiente' },
    ACCEPTED:  { bg: '#f0faf4', color: '#2d7a4f', label: 'Aceptado'  },
    REJECTED:  { bg: '#fdf2f2', color: '#c0392b', label: 'Rechazado' },
    CANCELLED: { bg: '#fdf2f2', color: '#c0392b', label: 'Cancelado' },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-8 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .r-card { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; }
        .r-ride { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; padding:1.25rem; transition:border-color 0.2s; }
        .r-ride:hover { border-color:#1a1a2e; }
        .status-badge { font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; padding:3px 10px; border-radius:2px; white-space:nowrap; }
        .r-btn-edit { background:#fafaf8; color:#6b6b6b; border:0.5px solid #d8d4cc; padding:5px 12px; font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; cursor:pointer; border-radius:2px; transition:all 0.2s; font-family:'DM Sans',sans-serif; text-decoration: none; display: inline-block; }
        .r-btn-edit:hover { border-color:#c8a96e; color:#c8a96e; }
        .pulse-line { background: #e8e4dc; border-radius: 2px; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Header */}
      <div className="r-card overflow-hidden mb-6">
        <div className="bg-[#1a1a2e] px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl text-white tracking-wide" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
              Mis Viajes
            </h1>
            <p className="text-[#8a8fa8] text-xs tracking-widest uppercase mt-1">
              Como conductor
            </p>
          </div>
        </div>
        <div className="w-full h-px bg-[#c8a96e] opacity-40" />
      </div>

      {feedback && (
        <div
          className="flex items-center gap-3 px-4 py-3 text-sm"
          style={{ background: '#f0faf4', borderLeft: '3px solid #2d7a4f', color: '#2d7a4f', borderRadius: '0 2px 2px 0' }}
        >
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="r-card p-6">
              <div className="pulse-line h-3 w-3/4 mb-3" />
              <div className="pulse-line h-2.5 w-1/2 mb-2" />
            </div>
          ))}
        </div>
      ) : rides.length === 0 ? (
        <div className="r-card p-12 text-center">
          <p className="text-5xl mb-4">🚗</p>
          <p className="text-[#999] text-sm">No has publicado viajes aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rides.map(ride => {
            const s = statusStyle[ride.status] || statusStyle.IN_PROGRESS;
            return (
              <div key={ride.id} className="r-ride flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 text-[#1a1a2e] font-medium text-sm">
                      <span style={{ color: '#c8a96e', fontSize: 12 }}>●</span>
                      {ride.originZone}
                      <span className="text-[#ccc] text-xs">→</span>
                      {ride.destinationZone}
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className="status-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#999] text-xs mb-4">
                  <span>{ride.departureDate}</span>
                  <span>{ride.departureTime}</span>
                  <span>{ride.availableSeats} asientos</span>
                  {ride.pricePerSeat > 0 && (
                    <span className="text-[#c8a96e] font-medium">${ride.pricePerSeat.toLocaleString()}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 mt-auto pt-3 border-t border-[#f5f5f5]">
                  {(ride.status === 'PUBLISHED' || ride.status === 'FULL') && (
                    <>
                      <button onClick={() => startRide(ride.id)} className="r-btn-edit">INICIAR</button>
                      <button onClick={() => cancelRide(ride.id)} className="r-btn-edit">CANCELAR</button>
                    </>
                  )}
                  {ride.status === 'IN_PROGRESS' && (
                    <>
                      <Link to={`/tracking/${ride.id}`} className="r-btn-edit">SEGUIMIENTO</Link>
                      <button onClick={() => completeRide(ride.id)} className="r-btn-edit">COMPLETAR</button>
                    </>
                  )}
                  <button onClick={() => loadRequests(ride.id)} className="r-btn-edit" style={{ marginLeft: 'auto' }}>
                    {requests[ride.id] ? '▲ SOLICITUDES' : '▼ SOLICITUDES'}
                  </button>
                </div>

                {/* Requests Section */}
                {requests[ride.id] && (
                  <div className="mt-3 pt-3 border-t border-[#f5f5f5] space-y-2">
                    {requests[ride.id].length === 0 ? (
                      <p className="text-[#999] text-xs">No hay solicitudes.</p>
                    ) : (
                      requests[ride.id].map(req => {
                        const rs = reqStatusStyle[req.status] || reqStatusStyle.PENDING;
                        return (
                          <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-2 rounded bg-[#fafafa] border border-[#eceae5]">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="status-badge" style={{ background: rs.bg, color: rs.color, fontSize: '9px', padding: '2px 6px' }}>{rs.label}</span>
                                <span className="text-[#1a1a2e] text-[11px] font-medium">{req.seatsRequested} asiento(s)</span>
                              </div>
                              {req.message && <p className="text-[#888] text-[10px] mt-1 italic">"{req.message}"</p>}
                            </div>
                            
                            {req.status === 'PENDING' && (
                              <div className="flex gap-1">
                                <button onClick={() => handleResponse(req.id, ride.id, 'accept')} className="r-btn-edit" style={{ padding: '3px 8px', fontSize: '9px' }}>ACEPTAR</button>
                                <button onClick={() => handleResponse(req.id, ride.id, 'reject')} className="r-btn-edit" style={{ padding: '3px 8px', fontSize: '9px' }}>RECHAZAR</button>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


