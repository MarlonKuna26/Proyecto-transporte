import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import type { RideRequest, Ride, UserProfile } from '@/types';
import { Link } from 'react-router-dom';
import { ToastContainer, type ToastMessage } from '@/components/Toast';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { ReportUserModal } from '@/components/ReportUserModal';

const parseMessage = (msg: string | null) => {
  if (!msg) return { cleanMessage: '', paymentInfo: null };
  const regex = /\[Pago:\s*(Efectivo|Transferencia|PayPal)(?:,\s*Ref:\s*([^\]]*))?\]/i;
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
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

  // State for Reporting
  const [reportDriver, setReportDriver] = useState<{ id: string, name: string, rideId: string } | null>(null);

  // State for Payment Modal
  const [paymentRide, setPaymentRide] = useState<Ride | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<RideRequest | null>(null);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('La imagen no debe superar los 2MB de tamaño.', 'error');
        return;
      }
      setComprobanteFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobantePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterPayment = async () => {
    if (!paymentRequest || !paymentRide) return;
    if (!comprobantePreview) {
      addToast('Por favor, selecciona una foto de tu comprobante de pago.', 'error');
      return;
    }

    setSubmittingPayment(true);
    try {
      const amount = paymentRequest.seatsRequested * paymentRide.pricePerSeat;
      await api.payments.create({
        rideRequestId: paymentRequest.id,
        amount,
        paymentMethod: 'TRANSFER',
        reference: reference.trim() || undefined,
        comprobanteUrl: comprobantePreview,
      });

      addToast('Comprobante subido y pago registrado exitosamente.', 'success');
      closePaymentModal();
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Error al registrar el pago.', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const closePaymentModal = () => {
    setPaymentRide(null);
    setPaymentRequest(null);
    setComprobanteFile(null);
    setComprobantePreview(null);
    setReference('');
  };

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

  const loadData = async () => {
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

      // Fetch my payments
      try {
        const paymentsRes = await api.payments.myPayments();
        setMyPayments(paymentsRes.data || []);
      } catch (err) {
        console.error('Error fetching my payments', err);
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

  useEffect(() => {
    loadData();
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

  const statusConfig: Record<string, { label: string; border: string; text: string; bg: string }> = {
    PENDING: { label: 'Pendiente', border: 'border-amber-500', text: 'text-black', bg: 'bg-white' },
    ACCEPTED: { label: 'Aceptada', border: 'border-emerald-500', text: 'text-black', bg: 'bg-white' },
    REJECTED: { label: 'Rechazada', border: 'border-red-500', text: 'text-black', bg: 'bg-white' },
    CANCELLED: { label: 'Cancelada', border: 'border-zinc-300', text: 'text-black', bg: 'bg-white' },
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

  const totalPages = Math.ceil(filteredRequests.length / pageSize);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div
      className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6"
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
      onChange={(e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
      }}
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
          onClick={() => {
            setStatusFilter(tab.key);
            setCurrentPage(1);
          }}
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {paginatedRequests.map(req => {

              const cfg = statusConfig[req.status] || statusConfig.PENDING;
              const ride = ridesMap[req.rideId];
              const { cleanMessage, paymentInfo } = parseMessage(req.message);

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-6 border border-uber-gray-100 shadow-uber-sm hover:shadow-uber-md transition-all duration-200 flex flex-col justify-between gap-5 animate-fade-in min-h-[200px]"
                >

                  <div className="flex flex-col justify-between h-full gap-4">

                    {/* Left Column Equivalent */}
                    <div className="flex-1 space-y-4">

                      {/* Status */}
                      <div className="flex items-center gap-2 flex-wrap">

                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap border shadow-sm ${cfg.bg} ${cfg.border} ${cfg.text}`}
                        >
                          {cfg.label}
                        </span>

                        <span className="text-xs font-bold text-black bg-white border border-zinc-200 px-2 py-1 rounded-lg">
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
                        <div className="bg-uber-gray-50 border border-uber-gray-100 rounded-xl px-4 py-2.5">
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
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm bg-white border ${
                              paymentInfo.method.toLowerCase() === 'efectivo'
                                  ? 'text-black border-emerald-500'
                                  : paymentInfo.method.toLowerCase() === 'transferencia'
                                    ? 'text-black border-blue-500'
                                    : 'text-black border-black font-black'
                            }`}
                          >
                            {paymentInfo.method.toLowerCase() === 'efectivo' ? '💵 Efectivo' 
                              : paymentInfo.method.toLowerCase() === 'transferencia' ? '🏦 Transferencia'
                              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> Pagar con PayPal</>}
                          </span>
                          {paymentInfo.reference && paymentInfo.reference !== '-' && (
                            <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-white text-zinc-600 border border-zinc-200 shadow-sm">
                              Ref: {paymentInfo.reference}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Column Equivalent (Actions) */}
                    <div className="flex flex-col gap-3 shrink-0">

                      {ride && (
                        <div className="flex justify-between items-center bg-uber-gray-50 p-3 rounded-xl border border-uber-gray-100">
                          <div className="text-[10px] text-uber-gray-400 font-bold uppercase tracking-wider">
                            Costo Estimado
                          </div>

                          <div className="text-xl font-black text-black">
                            ${(req.seatsRequested * ride.pricePerSeat).toLocaleString()}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        {/* CANCEL */}
                        {(req.status === 'PENDING' || (req.status === 'ACCEPTED' && ride && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && ride.status !== 'IN_PROGRESS')) && (
                          <button
                            onClick={() => setCancelRequestId(req.id)}
                            className="w-full py-2.5 text-xs font-bold text-red-600 bg-white hover:bg-red-50 border border-red-100 rounded-xl transition-all cursor-pointer"
                          >
                            Cancelar solicitud
                          </button>
                        )}

                        {/* VER PAGO / PAGAR */}
                        {req.status === 'ACCEPTED' && paymentInfo && (paymentInfo.method.toLowerCase() === 'transferencia' || paymentInfo.method.toLowerCase() === 'paypal') && ride && ride.status !== 'CANCELLED' && (
                          (() => {
                            const existingPayment = myPayments.find(p => p.solicitud_viaje_id === req.id);
                            const isPaidWithPayPal = existingPayment && existingPayment.metodo_pago === 'PAYPAL' && existingPayment.estado === 'COMPLETED';
                            
                            if (isPaidWithPayPal) {
                              return (
                                <div className="w-full py-2.5 text-[10px] uppercase tracking-wider font-black rounded-xl text-black bg-white border border-emerald-500 flex items-center justify-center gap-1.5 cursor-default shadow-sm">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                  Pagado con PayPal
                                </div>
                              );
                            }

                            return (
                              <button
                                onClick={() => {
                                  setPaymentRide(ride);
                                  setPaymentRequest(req);
                                }}
                                className={`w-full py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm uppercase tracking-wide bg-white ${
                                  paymentInfo.method.toLowerCase() === 'paypal' 
                                    ? 'text-black border-black'
                                    : 'text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                                }`}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                                {paymentInfo.method.toLowerCase() === 'paypal' ? 'Pagar con PayPal' : 'Ver datos de pago'}
                              </button>
                            );
                          })()
                        )}

                        {/* SEGUIMIENTO DE VIAJE (Para pasajeros) */}
                        {req.status === 'ACCEPTED' && ride && ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && (
                          <Link
                            to={`/tracking/${ride.id}`}
                            className="w-full py-2.5 text-xs font-bold text-white bg-black hover:bg-zinc-800 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            style={{ textDecoration: 'none' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2a10 10 0 0 0-10 10c0 5.25 10 12 10 12s10-6.75 10-12a10 10 0 0 0-10-10z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Ver seguimiento
                          </Link>
                        )}

                        <div className="flex gap-2 w-full">
                          {/* CALIFICAR VIAJE */}
                          {ride && (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') && !hasAlreadyRated(ride.id) && (
                            <button
                              onClick={() => {
                                setRatingRide(ride);
                                setRatingScore(5);
                                setRatingComment('');
                              }}
                              className="flex-1 py-2 text-xs font-bold text-black bg-white hover:bg-zinc-50 border border-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                              Calificar
                            </button>
                          )}

                          {/* REPORTAR CONDUCTOR */}
                          {ride && (ride.status === 'COMPLETED' || ride.status === 'CANCELLED' || req.status === 'ACCEPTED') && (
                            <button
                              onClick={() => {
                                setReportDriver({
                                  id: ride.driverId,
                                  name: 'Conductor',
                                  rideId: ride.id
                                });
                              }}
                              className="flex-1 py-2 text-xs font-bold text-red-600 bg-white hover:bg-red-50 border border-red-100 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                              Reportar
                            </button>
                          )}
                        </div>

                        {/* YA CALIFICADO */}
                        {ride && (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') && hasAlreadyRated(ride.id) && (
                          <span className="w-full flex items-center justify-center gap-1.5 text-xs font-black text-black bg-white border border-emerald-500 py-2.5 rounded-xl shadow-sm">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            Calificado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="pt-3 border-t border-uber-gray-100 flex items-center justify-between text-[10px] text-uber-gray-400 font-medium mt-auto">

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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl border border-uber-gray-200 flex items-center justify-center text-black hover:bg-uber-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm ${
                      currentPage === page
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border border-uber-gray-200 hover:bg-uber-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl border border-uber-gray-200 flex items-center justify-center text-black hover:bg-uber-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          )}
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
      {paymentRide && paymentRequest && (() => {
        const existingPayment = myPayments.find(p => p.solicitud_viaje_id === paymentRequest.id);
        const amount = paymentRequest.seatsRequested * paymentRide.pricePerSeat;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile flex flex-col max-h-[90vh]">
              
              <div className="bg-black text-white px-6 py-5 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-lg font-bold">
                    {existingPayment ? 'Detalles de Pago' : 'Registrar Pago'}
                  </h3>
                  <p className="text-xs text-uber-gray-400 mt-0.5">
                    {existingPayment ? 'Información del pago realizado' : 'Realiza la transferencia al conductor'}
                  </p>
                </div>
                <button 
                  onClick={closePaymentModal}
                  className="text-white hover:text-uber-gray-300 transition-colors bg-transparent border-none cursor-pointer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Total amount to pay */}
                <div className="text-center bg-uber-gray-50 border border-uber-gray-100 rounded-2xl py-4">
                  <span className="text-[10px] text-uber-gray-400 block font-bold uppercase tracking-wider">Monto a Transferir</span>
                  <span className="text-3xl font-black text-black block mt-1">${amount.toLocaleString()}</span>
                </div>

                {existingPayment ? (
                  /* EXISTING PAYMENT DISPLAY */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-uber-gray-50 rounded-xl border border-uber-gray-100">
                      <span className="text-xs font-semibold text-uber-gray-500">Estado:</span>
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                        style={{
                          background:
                            existingPayment.estado === 'PENDING' ? '#FFF3E0' :
                            existingPayment.estado === 'COMPLETED' ? '#E6F4EA' :
                            existingPayment.estado === 'REFUNDED' ? '#E8F0FE' : '#FDECEA',
                          color:
                            existingPayment.estado === 'PENDING' ? '#FF6937' :
                            existingPayment.estado === 'COMPLETED' ? '#06C167' :
                            existingPayment.estado === 'REFUNDED' ? '#276EF1' : '#E11900'
                        }}
                      >
                        {existingPayment.estado === 'PENDING' ? 'Pendiente de verificación' :
                         existingPayment.estado === 'COMPLETED' ? 'Completado' :
                         existingPayment.estado === 'REFUNDED' ? 'Reembolsado' : 'Fallido'}
                      </span>
                    </div>

                    {existingPayment.referencia_transaccion && (
                      <div className="p-3 bg-uber-gray-50 rounded-xl border border-uber-gray-100 flex justify-between items-center text-xs">
                        <span className="font-semibold text-uber-gray-500">Referencia:</span>
                        <span className="font-bold text-black">{existingPayment.referencia_transaccion}</span>
                      </div>
                    )}

                    {existingPayment.comprobante_url ? (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-uber-gray-400 uppercase tracking-wider block">Comprobante de Pago</span>
                        <div className="rounded-2xl overflow-hidden border border-uber-gray-200 bg-uber-gray-50 p-2">
                          <img
                            src={existingPayment.comprobante_url}
                            alt="Comprobante de pago"
                            className="w-full max-h-56 object-contain rounded-xl"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-uber-gray-400 italic">No se adjuntó imagen del comprobante.</p>
                    )}

                    <div className="pt-4">
                      <button
                        onClick={closePaymentModal}
                        className="w-full py-3 text-sm font-bold bg-black text-white rounded-xl cursor-pointer border-none"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* NEW PAYMENT REGISTER FORM OR PAYPAL */
                  paymentRequest.message?.toLowerCase().includes('paypal') ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                        <span className="text-xl">💳</span>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-indigo-900">Paga de forma segura</h4>
                          <p className="text-xs text-indigo-800 mt-1">Completa tu pago a través de PayPal. El estado de la transacción se actualizará automáticamente.</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 z-10 relative">
                        <PayPalScriptProvider options={{ clientId: "AVAGIsVWfwW24mk0c3v_Sg5xTtpcCRGtCLtKM4WpZ7Ei5FHXxt_0jKX1rWG8b7v3IMYs1E8TX6nRPYkb", currency: "USD" }}>
                          <PayPalButtons
                            style={{ layout: "vertical" }}
                            createOrder={async () => {
                              try {
                                const response = await api.payments.createPayPalOrder({
                                  rideRequestId: paymentRequest.id,
                                  amount: amount.toFixed(2)
                                });
                                return response.orderID;
                              } catch (error) {
                                addToast('Error al crear la orden de PayPal', 'error');
                                throw error;
                              }
                            }}
                            onApprove={async (data, actions) => {
                              try {
                                setSubmittingPayment(true);
                                await api.payments.capturePayPalOrder({
                                  orderID: data.orderID,
                                  rideRequestId: paymentRequest.id,
                                  amount: amount.toFixed(2)
                                });
                                addToast('¡Pago con PayPal exitoso!', 'success');
                                closePaymentModal();
                                loadData();
                              } catch (error) {
                                addToast('Error al confirmar el pago', 'error');
                              } finally {
                                setSubmittingPayment(false);
                              }
                            }}
                          />
                        </PayPalScriptProvider>
                      </div>

                      <div className="pt-4 border-t border-uber-gray-100">
                        <button
                          onClick={closePaymentModal}
                          className="w-full py-3 text-sm font-semibold bg-uber-gray-50 hover:bg-uber-gray-100 text-black border border-uber-gray-200 rounded-xl transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    {/* Bank account details */}
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

                    {/* Inputs */}
                    <div className="space-y-4">
                      {/* Reference code input */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-uber-gray-500 uppercase tracking-wider pl-1">
                          Referencia de Transacción (opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ingresa el número de referencia / transferencia..."
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-uber-gray-200 outline-none focus:border-black text-sm"
                        />
                      </div>

                      {/* File selector for comprovante */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-uber-gray-500 uppercase tracking-wider pl-1">
                          Subir Comprobante (requerido)
                        </label>
                        
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-uber-gray-200 rounded-2xl p-4 bg-uber-gray-50 hover:bg-uber-gray-100 transition-colors cursor-pointer relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {comprobantePreview ? (
                            <div className="w-full space-y-2">
                              <img
                                src={comprobantePreview}
                                alt="Vista previa del comprobante"
                                className="w-full max-h-40 object-contain rounded-lg"
                              />
                              <p className="text-[10px] text-center text-black font-bold">¡Imagen seleccionada! Haz clic o arrastra para cambiar</p>
                            </div>
                          ) : (
                            <div className="text-center space-y-1.5 py-3">
                              <svg className="mx-auto h-8 w-8 text-uber-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <p className="text-xs font-semibold text-black">Selecciona la foto de la transferencia</p>
                              <p className="text-[9px] text-uber-gray-400">PNG, JPG de hasta 2MB</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-4 border-t border-uber-gray-100">
                      <button
                        onClick={handleRegisterPayment}
                        disabled={submittingPayment || !comprobantePreview}
                        className="flex-1 py-3 text-sm font-bold text-white bg-black hover:bg-uber-gray-800 disabled:bg-uber-gray-200 disabled:text-uber-gray-400 transition-colors rounded-xl border-none cursor-pointer flex items-center justify-center"
                      >
                        {submittingPayment ? 'Registrando...' : 'Registrar Pago'}
                      </button>
                      <button
                        onClick={closePaymentModal}
                        disabled={submittingPayment}
                        className="flex-1 py-3 text-sm font-semibold bg-uber-gray-50 hover:bg-uber-gray-100 text-black border border-uber-gray-200 rounded-xl transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ REPORT MODAL ═══ */}
      {reportDriver && (
        <ReportUserModal
          reportedUserId={reportDriver.id}
          reportedUserName={reportDriver.name}
          reportedUserRole="DRIVER"
          rideId={reportDriver.rideId}
          onClose={() => setReportDriver(null)}
          onSuccess={() => setReportDriver(null)}
        />
      )}
    </div>
  );
};