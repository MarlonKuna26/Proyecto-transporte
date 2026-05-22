import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import type { RideRequest, Ride, UserProfile } from '@/types';
import { Link } from 'react-router-dom';
import { ToastContainer, type ToastMessage } from '@/components/Toast';

const parseMessage = (msg: string | null) => {
  if (!msg) return { cleanMessage: '', paymentInfo: null };
  const regex = /\[Pago:\s*(Efectivo|Transferencia)(?:,\s*Ref:\s*([^\]]*))?\]/i;
  const match = msg.match(regex);
  if (match) {
    const cleanMessage = msg.replace(regex, '').trim();
    return {
      cleanMessage,
      paymentInfo: {
        method: match[1],
        reference: match[2] ? match[2].trim() : null
      }
    };
  }
  return { cleanMessage: msg, paymentInfo: null };
};


export const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [ridesMap, setRidesMap] = useState<Record<string, Ride>>({});
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  // FILTROS
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Custom Modal State for Cancellation
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);

  // States for Rating
  const [ratingRide, setRatingRide] = useState<Ride | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [submittingRating, setSubmittingRating] = useState<boolean>(false);
  const [givenRatings, setGivenRatings] = useState<any[]>([]);
  const [driverProfile, setDriverProfile] = useState<UserProfile | null>(null);

  // State for Payment Modal
  const [paymentRide, setPaymentRide] = useState<Ride | null>(null);

  const hasAlreadyRated = (rideId: string) => {
    return givenRatings.some(r => r.rideId === rideId);
  };

  useEffect(() => {
    const activeRide = ratingRide || paymentRide;
    if (activeRide) {
      api.users.getProfile(activeRide.driverId)
        .then(res => {
          if (res.data) {
            setDriverProfile(res.data);
          }
        })
        .catch(err => {
          console.error('Error fetching driver profile', err);
        });
    } else {
      setDriverProfile(null);
    }
  }, [ratingRide, paymentRide]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.rideRequests.myRequests();
        const requestList: RideRequest[] = res.data || [];
        setRequests(requestList);

        // Fetch given ratings
        try {
          const ratingsRes = await api.ratings.getGiven();
          setGivenRatings(ratingsRes.data || []);
        } catch (err) {
          console.error('Error fetching given ratings', err);
        }

        // Fetch ride details for unique ride IDs
        const uniqueRideIds = Array.from(new Set(requestList.map(r => r.rideId)));

        const map: Record<string, Ride> = {};

        await Promise.all(
          uniqueRideIds.map(async (rideId) => {
            try {
              const rideRes = await api.rides.getById(rideId);

              if (rideRes.data) {
                map[rideId] = rideRes.data;
              }
            } catch (err) {
              console.error('Error fetching ride details', rideId, err);
            }
          })
        );

        setRidesMap(map);
      } catch { }

      setLoading(false);
    };

    load();
  }, []);

  // ===== TOAST FUNCTIONS =====
  const addToast = (msg: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { id, msg, type, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const executeCancelRequest = async () => {
    if (!cancelRequestId) return;

    try {
      await api.rideRequests.cancel(cancelRequestId);

      setRequests(prev =>
        prev.map(r =>
          r.id === cancelRequestId
            ? { ...r, status: 'CANCELLED' as const }
            : r
        )
      );

      addToast('Solicitud cancelada con éxito', 'success');
      setCancelRequestId(null);
    } catch (err: any) {
      addToast(err.message, 'error');
      setCancelRequestId(null);
    }
  };

  const handleSendRating = async () => {
    if (!ratingRide) return;
    setSubmittingRating(true);
    try {
      await api.ratings.create({
        rideId: ratingRide.id,
        ratedId: ratingRide.driverId,
        score: ratingScore,
        comment: ratingComment.trim() || null
      });
      setGivenRatings(prev => [...prev, { rideId: ratingRide.id }]);
      addToast('¡Calificación enviada con éxito!', 'success');
      setRatingRide(null);
    } catch (err: any) {
      addToast(err.message || 'Error al enviar calificación', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    PENDING: { label: 'Pendiente', bg: '#FFF3E0', color: '#FF6937' },
    ACCEPTED: { label: 'Aceptada', bg: '#E6F4EA', color: '#06C167' },
    REJECTED: { label: 'Rechazada', bg: '#FDECEA', color: '#E11900' },
    CANCELLED: { label: 'Cancelada', bg: '#F6F6F6', color: '#545454' },
  };

  // =========================
  // FILTRADO
  // =========================
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {

      // FILTRO POR ESTADO
      if (statusFilter !== 'ALL' && req.status !== statusFilter) {
        return false;
      }

      // BUSQUEDA
      const ride = ridesMap[req.rideId];

      const text = `
        ${ride?.originZone || ''}
        ${ride?.destinationZone || ''}
        ${ride?.originDetail || ''}
        ${ride?.destinationDetail || ''}
        ${req.message || ''}
      `.toLowerCase();

      if (!text.includes(search.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [requests, ridesMap, statusFilter, search]);

  return (
    <div
      className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >

      {/* ═══ HEADER SECTION ═══ */}
      <div className="pb-4 border-b border-uber-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            Mis solicitudes
          </h1>

          <p className="text-sm text-uber-gray-500 mt-1">
            Historial de solicitudes enviadas para unirte a viajes de compañeros
          </p>
        </div>

        <Link
          to="/rides"
          className="uber-btn-primary self-start md:self-center inline-flex items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          Buscar viajes disponibles
        </Link>
      </div>

      {/* ═══ FILTROS ═══ */}
<div className="bg-white rounded-2xl border border-uber-gray-100 p-4 flex flex-col gap-4 shadow-uber-sm">

  {/* BUSCADOR */}
  <div>
    <input
      type="text"
      placeholder="Buscar por origen, destino o mensaje..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-uber-gray-200 outline-none focus:border-black text-sm"
    />
  </div>

  {/* TABS */}
  <div className="flex flex-wrap gap-2">

    {[
      { key: 'ALL', label: 'Todas' },
      { key: 'PENDING', label: 'Pendientes' },
      { key: 'ACCEPTED', label: 'Aceptadas' },
      { key: 'REJECTED', label: 'Rechazadas' },
      { key: 'CANCELLED', label: 'Canceladas' },
    ].map(tab => {

      const active = statusFilter === tab.key;

      return (
        <button
          key={tab.key}
          onClick={() => setStatusFilter(tab.key)}
          className="px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer border"
          style={{
            background: active ? '#000' : '#fff',
            color: active ? '#fff' : '#545454',
            borderColor: active ? '#000' : '#E5E5E5'
          }}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
</div>


      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      <ToastContainer messages={messages} onClose={removeToast} />

      {/* ═══ REQUESTS LIST ═══ */}
      {loading ? (
        <div className="space-y-4 animate-fade-in">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-uber-gray-100 animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-4 bg-uber-gray-100 rounded w-1/4" />
                <div className="h-4 bg-uber-gray-100 rounded w-1/6" />
              </div>

              <div className="h-3 bg-uber-gray-100 rounded w-2/3" />

              <div className="h-10 bg-uber-gray-50 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (

        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-uber-gray-100 shadow-uber-sm max-w-xl mx-auto my-6 animate-fade-in">

          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-uber-gray-50 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBCBCB" strokeWidth="1.5">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          </div>

          <h3 className="text-xl font-bold text-black mb-2">
            No se encontraron solicitudes
          </h3>

          <p className="text-sm text-uber-gray-500 mb-6 max-w-sm mx-auto">
            Intenta cambiar los filtros o buscar otro viaje.
          </p>
        </div>

      ) : (

        /* Requests Cards List */
        <div className="space-y-4">

          {filteredRequests.map(req => {

            const cfg = statusConfig[req.status] || statusConfig.PENDING;
            const ride = ridesMap[req.rideId];
            const { cleanMessage, paymentInfo } = parseMessage(req.message);

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-6 border border-uber-gray-100 shadow-uber-sm hover:shadow-uber-md transition-all duration-200 flex flex-col justify-between gap-5 animate-fade-in"
              >

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

                  {/* Left Column */}
                  <div className="flex-1 space-y-4">

                    {/* Status */}
                    <div className="flex items-center gap-2 flex-wrap">

                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>

                      <span className="text-xs font-semibold text-black bg-uber-gray-50 px-2 py-0.5 rounded">
                        {req.seatsRequested} asiento{req.seatsRequested !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* ROUTE */}
                    {ride && (
                      <div className="space-y-3">

                        <div className="flex gap-3">

                          <div className="flex flex-col items-center gap-1.5 mt-1 shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-black" />
                            <div className="w-0.5 h-7 bg-uber-gray-200" />
                            <div className="w-2.5 h-2.5 bg-black" style={{ borderRadius: '2px' }} />
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="text-xs text-uber-gray-400 font-bold uppercase tracking-wider leading-none">
                              Origen
                            </div>

                            <div className="font-bold text-black text-sm truncate mt-0.5 leading-normal">
                              {ride.originZone}
                            </div>

                            <div className="h-3.5" />

                            <div className="text-xs text-uber-gray-400 font-bold uppercase tracking-wider leading-none">
                              Destino
                            </div>

                            <div className="font-bold text-black text-sm truncate mt-0.5 leading-normal">
                              {ride.destinationZone}
                            </div>

                          </div>
                        </div>
                      </div>
                    )}

                    {/* MESSAGE */}
                    {cleanMessage && (
                      <div className="bg-uber-gray-50 border border-uber-gray-100 rounded-xl px-4 py-2.5 max-w-xl">
                        <span className="block text-[9px] text-uber-gray-400 font-bold uppercase tracking-wider mb-0.5">
                          Tu mensaje
                        </span>

                        <p className="text-xs text-uber-gray-700 font-medium leading-relaxed">
                          "{cleanMessage}"
                        </p>
                      </div>
                    )}

                    {/* PAYMENT METHOD BADGES */}
                    {paymentInfo && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            paymentInfo.method.toLowerCase() === 'efectivo'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}
                        >
                          {paymentInfo.method.toLowerCase() === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}
                        </span>
                        {paymentInfo.reference && paymentInfo.reference !== '-' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                            Ref: {paymentInfo.reference}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-row md:flex-col md:items-end justify-between items-center md:justify-start gap-4 md:text-right shrink-0">

                    {ride && (
                      <div>
                        <div className="text-[10px] text-uber-gray-400 font-bold uppercase tracking-wider">
                          Costo Estimado
                        </div>

                        <div className="text-2xl font-black text-black mt-0.5">
                          ${(req.seatsRequested * ride.pricePerSeat).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* CANCEL */}
                    {(req.status === 'PENDING' || (req.status === 'ACCEPTED' && ride && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && ride.status !== 'IN_PROGRESS')) && (
                      <button
                        onClick={() => setCancelRequestId(req.id)}
                        className="px-4 py-2.5 text-xs font-bold text-uber-red bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-xl transition-all self-start md:self-auto cursor-pointer"
                      >
                        Cancelar solicitud
                      </button>
                    )}

                    {/* VER PAGO */}
                    {req.status === 'ACCEPTED' && paymentInfo && paymentInfo.method.toLowerCase() === 'transferencia' && ride && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setPaymentRide(ride)}
                        className="px-4 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-xl transition-all self-start md:self-auto cursor-pointer flex items-center gap-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                        Ver datos de pago
                      </button>
                    )}

                    {/* CALIFICAR VIAJE */}
                    {ride && (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') && !hasAlreadyRated(ride.id) && (
                      <button
                        onClick={() => {
                          setRatingRide(ride);
                          setRatingScore(5);
                          setRatingComment('');
                        }}
                        className="px-4 py-2.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 rounded-xl transition-all self-start md:self-auto cursor-pointer flex items-center gap-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        Calificar conductor
                      </button>
                    )}

                    {/* YA CALIFICADO */}
                    {ride && (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') && hasAlreadyRated(ride.id) && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl self-start md:self-auto">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        Calificado
                      </span>
                    )}
                  </div>
                </div>

                {/* FOOTER */}
                <div className="pt-3 border-t border-uber-gray-100 flex items-center justify-between text-[10px] text-uber-gray-400 font-medium">

                  <span>
                    ID Solicitud: {req.id.substring(0, 8)}...
                  </span>

                  <span>
                    Solicitada el{' '}
                    {new Date(req.createdAt).toLocaleDateString('es', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      {cancelRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">

          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile">

            <div className="bg-black text-white px-6 py-5 shrink-0">
              <h3 className="text-lg font-bold">
                ¿Cancelar solicitud?
              </h3>

              <p className="text-xs text-uber-gray-400 mt-0.5">
                Esta acción retirará tu interés en este viaje
              </p>
            </div>

            <div className="p-6 space-y-4">

              <div className="flex items-start gap-4">

                <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-red-50 border border-red-200 rounded-full text-uber-red">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-black">
                    ¿Confirmas la cancelación?
                  </h4>

                  <p className="text-xs text-uber-gray-500 mt-1 leading-relaxed">
                    Deberás enviar una nueva solicitud si deseas volver a unirte.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-uber-gray-100">

                <button
                  onClick={executeCancelRequest}
                  className="flex-1 py-3 text-sm font-bold text-white bg-uber-red hover:bg-red-700 transition-colors rounded-xl border-none cursor-pointer"
                >
                  Confirmar y Retirar
                </button>

                <button
                  onClick={() => setCancelRequestId(null)}
                  className="flex-1 py-3 text-sm font-semibold bg-uber-gray-50 hover:bg-uber-gray-100 text-black border border-uber-gray-200 rounded-xl transition-all cursor-pointer"
                >
                  Regresar
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ RATING MODAL ═══ */}
      {ratingRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile">
            
            {/* Modal Header */}
            <div className="bg-black text-white px-6 py-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold">Calificar viaje</h3>
                <p className="text-xs text-uber-gray-400 mt-0.5">
                  Comparte tu experiencia para ayudar a la comunidad
                </p>
              </div>
              <button 
                onClick={() => setRatingRide(null)}
                className="text-white hover:text-uber-gray-300 transition-colors bg-transparent border-none cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* Driver info */}
              <div className="flex items-center gap-3.5 p-3 bg-uber-gray-50 rounded-2xl border border-uber-gray-100">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-uber-gray-200 shrink-0 border border-white shadow-sm flex items-center justify-center">
                  {driverProfile?.photoUrl ? (
                    <img 
                      src={driverProfile.photoUrl} 
                      alt={driverProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-uber-gray-600">
                      {driverProfile?.name ? driverProfile.name.charAt(0).toUpperCase() : 'C'}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-uber-gray-400 font-bold uppercase tracking-wider leading-none">
                    Conductor
                  </div>
                  <div className="font-bold text-black text-sm truncate mt-1">
                    {driverProfile?.name || 'Cargando...'}
                  </div>
                  <div className="text-xs text-uber-gray-500 mt-0.5">
                    {ratingRide.originZone} → {ratingRide.destinationZone}
                  </div>
                </div>
              </div>

              {/* Star selector */}
              <div className="space-y-2 text-center">
                <label className="block text-xs font-bold text-uber-gray-400 uppercase tracking-wider">
                  Tu Calificación
                </label>
                <div className="flex justify-center gap-1.5 py-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isSelected = star <= ratingScore;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingScore(star)}
                        className="p-1 hover:scale-110 transition-transform bg-transparent border-none cursor-pointer"
                      >
                        <svg 
                          width="36" 
                          height="36" 
                          viewBox="0 0 24 24" 
                          fill={isSelected ? '#FFC000' : 'none'} 
                          stroke={isSelected ? '#FFC000' : '#CBCBCB'} 
                          strokeWidth="1.5"
                          style={{ filter: isSelected ? 'drop-shadow(0 0 2px rgba(255, 192, 0, 0.4))' : 'none' }}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-bold text-black">
                  {ratingScore === 5 && '¡Excelente servicio! 🌟'}
                  {ratingScore === 4 && 'Muy buen viaje 👍'}
                  {ratingScore === 3 && 'Aceptable 😐'}
                  {ratingScore === 2 && 'Malo, mejorable 👎'}
                  {ratingScore === 1 && 'Muy malo 😡'}
                </div>
              </div>

              {/* Comment field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-uber-gray-400 uppercase tracking-wider">
                  Comentario (opcional)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Escribe tu opinión sobre el viaje o el conductor..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-xl border border-uber-gray-200 outline-none focus:border-black text-sm resize-none"
                />
                <div className="text-[10px] text-right text-uber-gray-400">
                  {ratingComment.length}/200 caracteres
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-uber-gray-100">
                <button
                  onClick={handleSendRating}
                  disabled={submittingRating}
                  className="flex-1 py-3 text-sm font-bold text-white bg-black hover:bg-uber-gray-800 disabled:bg-uber-gray-200 disabled:text-uber-gray-400 transition-colors rounded-xl border-none cursor-pointer flex items-center justify-center"
                >
                  {submittingRating ? 'Enviando...' : 'Enviar calificación'}
                </button>
                <button
                  onClick={() => setRatingRide(null)}
                  disabled={submittingRating}
                  className="flex-1 py-3 text-sm font-semibold bg-uber-gray-50 hover:bg-uber-gray-100 text-black border border-uber-gray-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      {/* ═══ PAYMENT MODAL ═══ */}
      {paymentRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile">
            
            <div className="bg-black text-white px-6 py-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold">Datos para pago</h3>
                <p className="text-xs text-uber-gray-400 mt-0.5">
                  Realiza la transferencia al conductor
                </p>
              </div>
              <button 
                onClick={() => setPaymentRide(null)}
                className="text-white hover:text-uber-gray-300 transition-colors bg-transparent border-none cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3.5 p-4 bg-uber-gray-50 border border-uber-gray-100 rounded-2xl">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* SVG Mock QR Code */}
                  <div className="p-2 bg-white rounded-xl border border-uber-gray-200 shadow-sm shrink-0">
                    <svg width="100" height="100" viewBox="0 0 100 100" className="text-black">
                      <path d="M5 5 h20 v5 h-15 v15 h-5 z" fill="currentColor"/>
                      <path d="M5 95 h20 v-5 h-15 v-15 h-5 z" fill="currentColor"/>
                      <path d="M95 5 h-20 v5 h15 v15 h5 z" fill="currentColor"/>
                      <path d="M95 95 h-20 v-5 h15 v-15 h5 z" fill="currentColor"/>
                      
                      <rect x="10" y="10" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <rect x="14" y="14" width="4" height="4" fill="currentColor"/>
                      
                      <rect x="78" y="10" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <rect x="82" y="14" width="4" height="4" fill="currentColor"/>
                      
                      <rect x="10" y="78" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <rect x="14" y="82" width="4" height="4" fill="currentColor"/>

                      <rect x="30" y="10" width="4" height="8" fill="currentColor"/>
                      <rect x="38" y="10" width="8" height="4" fill="currentColor"/>
                      <rect x="50" y="10" width="4" height="4" fill="currentColor"/>
                      <rect x="60" y="12" width="8" height="4" fill="currentColor"/>
                      
                      <rect x="30" y="24" width="12" height="4" fill="currentColor"/>
                      <rect x="46" y="20" width="4" height="12" fill="currentColor"/>
                      <rect x="54" y="24" width="8" height="8" fill="currentColor"/>
                      
                      <rect x="10" y="34" width="16" height="4" fill="currentColor"/>
                      <rect x="30" y="38" width="4" height="16" fill="currentColor"/>
                      <rect x="38" y="38" width="12" height="4" fill="currentColor"/>
                      <rect x="54" y="38" width="4" height="8" fill="currentColor"/>
                      <rect x="64" y="34" width="16" height="8" fill="currentColor"/>
                      
                      <rect x="10" y="54" width="8" height="4" fill="currentColor"/>
                      <rect x="22" y="50" width="4" height="8" fill="currentColor"/>
                      <rect x="38" y="50" width="8" height="12" fill="currentColor"/>
                      <rect x="50" y="54" width="24" height="4" fill="currentColor"/>
                      <rect x="78" y="50" width="4" height="16" fill="currentColor"/>
                      
                      <rect x="30" y="68" width="16" height="4" fill="currentColor"/>
                      <rect x="50" y="68" width="4" height="12" fill="currentColor"/>
                      <rect x="58" y="64" width="12" height="8" fill="currentColor"/>
                      
                      <rect x="30" y="80" width="8" height="8" fill="currentColor"/>
                      <rect x="42" y="84" width="16" height="4" fill="currentColor"/>
                      <rect x="62" y="80" width="4" height="12" fill="currentColor"/>
                      <rect x="70" y="84" width="4" height="4" fill="currentColor"/>
                      
                      <rect x="42" y="42" width="16" height="16" fill="white"/>
                      <rect x="45" y="45" width="10" height="10" fill="black"/>
                      <text x="50" y="53" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">U</text>
                    </svg>
                  </div>

                  <div className="text-xs text-uber-gray-700 space-y-1.5 min-w-0 flex-1">
                    <p className="font-extrabold text-black">Banco Pichincha (Ahorros)</p>
                    <p className="font-semibold text-black">Nro: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-uber-gray-200 select-all font-bold">2200123456</span></p>
                    <p className="font-medium truncate">Titular: {driverProfile?.name || 'Conductor del Viaje'}</p>
                    <p className="text-[10px] text-uber-gray-400">
                      Escanea el QR o transfiere a la cuenta mostrada.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-uber-gray-100">
                <button
                  onClick={() => setPaymentRide(null)}
                  className="w-full py-3 text-sm font-bold bg-black text-white rounded-xl cursor-pointer border-none"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};