import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Ride, RideRequest } from '@/types';

export const MyRidesPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<Record<string, RideRequest[]>>({});
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  // Custom Modal States
  const [cancelRideId, setCancelRideId] = useState<string | null>(null);
  const [rejectReqId, setRejectReqId] = useState<string | null>(null);
  const [rejectRideId, setRejectRideId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

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
    if (requests[rideId]) {
      setRequests(prev => {
        const n = { ...prev };
        delete n[rideId];
        return n;
      });
      return;
    }
    try {
      const res = await api.rideRequests.byRide(rideId);
      setRequests(prev => ({ ...prev, [rideId]: res.data || [] }));
    } catch { }
  };

  const handleResponse = async (requestId: string, rideId: string, action: 'accept' | 'reject') => {
    if (action === 'accept') {
      try {
        await api.rideRequests.accept(requestId);
        setFeedback(`Solicitud aceptada con éxito`);
        loadRequests(rideId);
        setTimeout(() => setFeedback(''), 3000);
      } catch (err: any) {
        setFeedback(err.message);
      }
    } else {
      // Trigger custom rejection modal instead of raw window.prompt
      setRejectReqId(requestId);
      setRejectRideId(rideId);
      setRejectReasonInput('');
    }
  };

  const confirmRejectRequest = async () => {
    if (!rejectReqId || !rejectRideId) return;
    if (!rejectReasonInput.trim()) {
      alert("Por favor, ingresa un motivo para el rechazo.");
      return;
    }
    try {
      await api.rideRequests.reject(rejectReqId, { rejectReason: rejectReasonInput });
      setFeedback(`Solicitud rechazada con éxito`);
      loadRequests(rejectRideId);
      setRejectReqId(null);
      setRejectRideId(null);
      setRejectReasonInput('');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  const executeCancelRide = async () => {
    if (!cancelRideId) return;
    try {
      await api.rides.cancel(cancelRideId);
      setRides(prev => prev.map(r => r.id === cancelRideId ? { ...r, status: 'CANCELLED' as const } : r));
      setFeedback('Viaje cancelado con éxito');
      setCancelRideId(null);
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

  const statusStyleMap: Record<string, { bg: string; color: string; label: string }> = {
    PUBLISHED:   { bg: '#E6F4EA', color: '#06C167', label: 'Disponible' },
    FULL:        { bg: '#FFF3E0', color: '#FF6937', label: 'Lleno' },
    IN_PROGRESS: { bg: '#E8F0FE', color: '#276EF1', label: 'En curso' },
    COMPLETED:   { bg: '#F6F6F6', color: '#545454', label: 'Completado' },
    CANCELLED:   { bg: '#FDECEA', color: '#E11900', label: 'Cancelado' },
  };

  const reqStatusStyleMap: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:   { bg: '#FFF3E0', color: '#FF6937', label: 'Pendiente' },
    ACCEPTED:  { bg: '#E6F4EA', color: '#06C167', label: 'Aceptado' },
    REJECTED:  { bg: '#FDECEA', color: '#E11900', label: 'Rechazado' },
    CANCELLED: { bg: '#F6F6F6', color: '#545454', label: 'Cancelado' },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ HEADER SECTION ═══ */}
      <div className="pb-4 border-b border-uber-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            Mis Viajes
          </h1>
          <p className="text-sm text-uber-gray-500 mt-1">
            Administra tus viajes publicados y solicitudes de pasajeros como conductor
          </p>
        </div>

        <Link
          to="/rides?create=true"
          className="uber-btn-primary self-start sm:self-center inline-flex items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Publicar nuevo viaje
        </Link>
      </div>

      {/* ═══ FEEDBACK NOTIFICATIONS ═══ */}
      {feedback && (
        <div className="flex items-center gap-3 px-4 py-3 text-sm rounded-xl border border-green-200 bg-green-50 text-uber-green animate-fade-in">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* ═══ RIDES LIST SECTION ═══ */}
      {loading ? (
        /* Uber Skeleton loaders */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-uber-gray-100 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-uber-gray-100" />
                <div className="flex-1">
                  <div className="h-3.5 bg-uber-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-uber-gray-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-uber-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : rides.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-uber-gray-100 shadow-uber-sm max-w-xl mx-auto my-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-uber-gray-50 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBCBCB" strokeWidth="1.5">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/>
              <circle cx="6.5" cy="15.5" r="1.5"/><circle cx="17.5" cy="15.5" r="1.5"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-black mb-2">Aún no has publicado viajes</h3>
          <p className="text-sm text-uber-gray-500 mb-6 max-w-sm mx-auto">
            Publica tus rutas de ida o regreso al campus para compartir tu auto con otros compañeros de la UTA.
          </p>
          <Link
            to="/rides?create=true"
            className="uber-btn-primary inline-flex items-center gap-2"
            style={{ textDecoration: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Publicar mi primer viaje
          </Link>
        </div>
      ) : (
        /* Rides Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rides.map(ride => {
            const s = statusStyleMap[ride.status] || statusStyleMap.IN_PROGRESS;
            const expanded = !!requests[ride.id];
            return (
              <div
                key={ride.id}
                className="bg-white rounded-2xl p-6 border border-uber-gray-100 shadow-uber-sm hover:shadow-uber-md transition-all duration-200 flex flex-col animate-fade-in"
              >
                {/* Route Header with dots */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex gap-3 min-w-0">
                    <div className="flex flex-col items-center gap-1.5 mt-1 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-black" />
                      <div className="w-0.5 h-7 bg-uber-gray-200" />
                      <div className="w-2.5 h-2.5 bg-black" style={{ borderRadius: '2px' }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-black truncate">{ride.originZone}</h3>
                      {ride.originDetail && (
                        <p className="text-xs text-uber-gray-400 truncate mt-0.5">{ride.originDetail}</p>
                      )}
                      <h3 className="text-sm font-semibold text-black truncate mt-3.5">{ride.destinationZone}</h3>
                      {ride.destinationDetail && (
                        <p className="text-xs text-uber-gray-400 truncate mt-0.5">{ride.destinationDetail}</p>
                      )}
                    </div>
                  </div>

                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Ride Info Panel */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-uber-gray-500 font-medium mb-4">
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {ride.departureDate} · {ride.departureTime}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {ride.availableSeats} asientos
                  </span>
                  {ride.pricePerSeat > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-black font-semibold">${ride.pricePerSeat.toLocaleString()}</span>
                    </>
                  )}
                </div>

                {/* Actions bottom strip */}
                <div className="mt-auto pt-4 border-t border-uber-gray-100 flex flex-wrap items-center gap-2">
                  {/* Start / Cancel actions */}
                  {(ride.status === 'PUBLISHED' || ride.status === 'FULL') && (
                    <>
                      <button
                        onClick={() => startRide(ride.id)}
                        className="px-4 py-2 text-xs font-bold bg-uber-black text-white hover:bg-uber-gray-800 rounded-lg transition-colors border-none"
                        style={{ cursor: 'pointer' }}
                      >
                        INICIAR VIAJE
                      </button>
                      <button
                        onClick={() => setCancelRideId(ride.id)}
                        className="px-4 py-2 text-xs font-bold bg-white text-uber-red border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                        style={{ cursor: 'pointer' }}
                      >
                        CANCELAR
                      </button>
                    </>
                  )}

                  {/* Tracking / Complete actions */}
                  {ride.status === 'IN_PROGRESS' && (
                    <>
                      <Link
                        to={`/tracking/${ride.id}`}
                        className="px-4 py-2 text-xs font-bold bg-uber-blue text-white hover:bg-blue-700 rounded-lg transition-colors"
                        style={{ textDecoration: 'none' }}
                      >
                        SEGUIMIENTO LIVE
                      </Link>
                      <button
                        onClick={() => completeRide(ride.id)}
                        className="px-4 py-2 text-xs font-bold bg-uber-black text-white hover:bg-uber-gray-800 rounded-lg transition-colors border-none"
                        style={{ cursor: 'pointer' }}
                      >
                        COMPLETAR
                      </button>
                    </>
                  )}

                  {/* Toggle requests expansion */}
                  <button
                    onClick={() => loadRequests(ride.id)}
                    className={`ml-auto px-3.5 py-2 text-xs font-bold rounded-lg border transition-all inline-flex items-center gap-1.5 ${
                      expanded
                        ? 'bg-uber-gray-100 text-black border-uber-gray-200'
                        : 'bg-white text-uber-gray-600 border-uber-gray-200 hover:bg-uber-gray-50'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <span>SOLICITUDES</span>
                    <svg
                      width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                </div>

                {/* Expanded Requests Section */}
                {expanded && (
                  <div className="mt-4 pt-4 border-t border-uber-gray-100 space-y-2 animate-fade-in">
                    <span className="block text-[10px] font-bold text-uber-gray-400 uppercase tracking-wider mb-2">
                      Solicitudes de pasajeros
                    </span>
                    {requests[ride.id].length === 0 ? (
                      <p className="text-xs text-uber-gray-400 pl-1 font-medium italic">No hay solicitudes pendientes o activas para este viaje.</p>
                    ) : (
                      <div className="space-y-2">
                        {requests[ride.id].map(req => {
                          const rs = reqStatusStyleMap[req.status] || reqStatusStyleMap.PENDING;
                          return (
                            <div
                              key={req.id}
                              className="p-3 bg-uber-gray-50 rounded-xl border border-uber-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                                    style={{ background: rs.bg, color: rs.color }}
                                  >
                                    {rs.label}
                                  </span>
                                  <span className="text-xs font-semibold text-black">
                                    {req.seatsRequested} asiento{req.seatsRequested > 1 ? 's' : ''} solicitado{req.seatsRequested > 1 ? 's' : ''}
                                  </span>
                                </div>
                                {req.message && (
                                  <p className="text-xs text-uber-gray-600 bg-white px-3 py-2 rounded-lg border border-uber-gray-100 mt-2 italic">
                                    "{req.message}"
                                  </p>
                                )}
                              </div>

                              {/* Response actions if pending */}
                              {req.status === 'PENDING' && (
                                <div className="flex gap-1.5 shrink-0 self-end sm:self-center" onClick={e => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleResponse(req.id, ride.id, 'accept')}
                                    className="px-3 py-1.5 text-xs font-bold bg-uber-black text-white hover:bg-uber-gray-800 rounded-lg transition-colors border-none"
                                    style={{ cursor: 'pointer' }}
                                  >
                                    ACEPTAR
                                  </button>
                                  <button
                                    onClick={() => handleResponse(req.id, ride.id, 'reject')}
                                    className="px-3 py-1.5 text-xs font-bold bg-white text-uber-gray-700 hover:bg-uber-gray-100 border border-uber-gray-200 rounded-lg transition-colors"
                                    style={{ cursor: 'pointer' }}
                                  >
                                    RECHAZAR
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CUSTOM MODAL: REJECT REQUEST MOTIVE ═══ */}
      {rejectReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile">
            {/* Header */}
            <div className="bg-black text-white px-6 py-5 shrink-0">
              <h3 className="text-lg font-bold">Rechazar solicitud</h3>
              <p className="text-xs text-uber-gray-400 mt-0.5">Por favor, especifica el motivo del rechazo</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-uber-gray-400 uppercase tracking-wider mb-1.5 pl-1">
                  Motivo del rechazo
                </label>
                <textarea
                  placeholder="Ej: Lo siento, ya no voy por esa ruta / Cupos completos por fuera..."
                  className="w-full px-4 py-3 bg-uber-gray-50 rounded-xl text-sm text-black border border-uber-gray-200 outline-none focus:ring-2 focus:ring-black/10 focus:border-black resize-none h-24"
                  value={rejectReasonInput}
                  onChange={e => setRejectReasonInput(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-uber-gray-100">
                <button
                  onClick={confirmRejectRequest}
                  className="flex-1 py-3 text-sm font-bold text-white bg-uber-black hover:bg-uber-gray-800 transition-colors rounded-xl border-none"
                  style={{ cursor: 'pointer' }}
                >
                  Enviar y Rechazar
                </button>
                <button
                  onClick={() => {
                    setRejectReqId(null);
                    setRejectRideId(null);
                    setRejectReasonInput('');
                  }}
                  className="flex-1 py-3 text-sm font-semibold bg-uber-gray-50 hover:bg-uber-gray-100 text-black border border-uber-gray-200 rounded-xl transition-all"
                  style={{ cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CUSTOM MODAL: CANCEL RIDE CONFIRMATION ═══ */}
      {cancelRideId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile">
            {/* Header */}
            <div className="bg-black text-white px-6 py-5 shrink-0">
              <h3 className="text-lg font-bold">¿Cancelar este viaje?</h3>
              <p className="text-xs text-uber-gray-400 mt-0.5">Esta acción notificará a todos tus pasajeros</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-red-50 border border-red-200 rounded-full text-uber-red">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black">¿Confirmas la cancelación definitiva?</h4>
                  <p className="text-xs text-uber-gray-500 mt-1 leading-relaxed">
                    Esta acción marcará el viaje como CANCELADO permanentemente. Los pasajeros aceptados serán notificados de forma inmediata.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-uber-gray-100">
                <button
                  onClick={executeCancelRide}
                  className="flex-1 py-3 text-sm font-bold text-white bg-uber-red hover:bg-red-700 transition-colors rounded-xl border-none"
                  style={{ cursor: 'pointer' }}
                >
                  Confirmar cancelación
                </button>
                <button
                  onClick={() => setCancelRideId(null)}
                  className="flex-1 py-3 text-sm font-semibold bg-uber-gray-50 hover:bg-uber-gray-100 text-black border border-uber-gray-200 rounded-xl transition-all"
                  style={{ cursor: 'pointer' }}
                >
                  Regresar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
