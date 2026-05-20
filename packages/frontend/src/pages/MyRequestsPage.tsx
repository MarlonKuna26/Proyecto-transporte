import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { RideRequest, Ride, Payment } from '@/types';
import { LiveMap } from '@/components/LiveMap';
import { ZONE_COORDINATES } from '@/constants';

export const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [rides, setRides] = useState<Record<string, Ride>>({});
  const [payments, setPayments] = useState<Payment[]>([]);
  const [viewRide, setViewRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  // States for payment registration modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedRequestForPay, setSelectedRequestForPay] = useState<RideRequest | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'WALLET'>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState('');

  const loadData = async () => {
    try {
      const [reqsRes, paysRes] = await Promise.all([
        api.rideRequests.myRequests(),
        api.payments.myPayments(),
      ]);
      const reqList = reqsRes.data || [];
      setRequests(reqList);
      setPayments(paysRes.data || []);
      
      // Load rides details for each request
      reqList.forEach(async (r: RideRequest) => {
        try {
          const rideRes = await api.rides.getById(r.rideId);
          setRides(prev => ({ ...prev, [r.rideId]: rideRes.data }));
        } catch {}
      });
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const cancelRequest = async (id: string) => {
    try {
      await api.rideRequests.cancel(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'CANCELLED' as const } : r));
      setFeedback('Solicitud cancelada');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setFeedback(err.message);
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForPay) return;
    const ride = rides[selectedRequestForPay.rideId];
    if (!ride) return;

    setSubmittingPayment(true);
    setPaymentFeedback('');
    try {
      await api.payments.create({
        rideRequestId: selectedRequestForPay.id,
        amount: ride.pricePerSeat,
        paymentMethod,
        reference: paymentMethod === 'CASH' ? undefined : paymentReference,
      });

      setFeedback('Pago registrado exitosamente');
      setShowPayModal(false);
      setSelectedRequestForPay(null);
      setPaymentReference('');
      setPaymentMethod('CASH');

      // Reload
      await loadData();
    } catch (err: any) {
      setPaymentFeedback(err.message || 'Error al registrar el pago');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    PENDING:   { label: 'Pendiente',  bg: '#fdf8f0', color: '#8a6a2e' },
    ACCEPTED:  { label: 'Aceptada',   bg: '#f0faf4', color: '#2d7a4f' },
    REJECTED:  { label: 'Rechazada',  bg: '#fdf2f2', color: '#c0392b' },
    CANCELLED: { label: 'Cancelada',  bg: '#fdf2f2', color: '#c0392b' },
  };

  const paymentStatusConfig: Record<string, { label: string; bg: string; color: string }> = {
    PENDING:   { label: 'Pago Pendiente Conductor', bg: '#fffbeb', color: '#b45309' },
    COMPLETED: { label: 'Pago Confirmado',  bg: '#ecfdf5', color: '#047857' },
    REFUNDED:  { label: 'Pago Reembolsado', bg: '#eff6ff', color: '#1d4ed8' },
    FAILED:    { label: 'Pago Fallido',     bg: '#fef2f2', color: '#b91c1c' },
  };

  const methodLabel: Record<string, string> = {
    CASH:     'Efectivo',
    TRANSFER: 'Transferencia',
    WALLET:   'Billetera Digital',
  };

  // Helper function to resolve coordinates (returns specific custom coordinates, or fallbacks to central zone coordinates)
  const getCoordinates = (zone: string, lat: number | null, lng: number | null): { lat: number; lng: number } | null => {
    if (lat !== null && lng !== null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      return { lat: Number(lat), lng: Number(lng) };
    }
    const fallback = ZONE_COORDINATES[zone];
    if (fallback) {
      return { lat: fallback[0], lng: fallback[1] };
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .mr-card { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; }
        .mr-item { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; padding:1.25rem; transition:border-color 0.2s; }
        .mr-item:hover { border-color:#1a1a2e; }
        .status-badge { font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; padding:3px 10px; border-radius:2px; display:inline-block; }
        .section-label { font-size:11px; font-weight:500; color:#6b6b6b; letter-spacing:0.1em; text-transform:uppercase; }
        .pulse-line { background:#e8e4dc; border-radius:2px; animation:pulse 1.5s ease-in-out infinite; }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {/* Page header */}
      <div className="mr-card overflow-hidden">
        <div className="bg-[#1a1a2e] px-8 py-6">
          <h1 className="text-2xl text-white tracking-wide" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
            Mis solicitudes
          </h1>
          <p className="text-[#8a8fa8] text-xs tracking-widest uppercase mt-1">
            Historial de solicitudes de viaje · U-Ride
          </p>
        </div>
        <div className="w-full h-px bg-[#c8a96e] opacity-40" />
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className="flex items-center gap-3 px-4 py-3 text-sm"
          style={{ background: '#f0faf4', borderLeft: '3px solid #2d7a4f', color: '#2d7a4f', borderRadius: '0 2px 2px 0' }}
        >
          <span>{feedback}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="mr-card p-5">
              <div className="pulse-line h-3 w-2/3 mb-2" />
              <div className="pulse-line h-2.5 w-1/3" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="mr-card p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#fdf8f0] mb-4" style={{ borderRadius: '2px' }}>
            <InboxIcon />
          </div>
          <p className="text-[#999] text-sm">No tienes solicitudes aún</p>
          <p className="text-[#bbb] text-xs mt-1">Busca viajes y solicita unirte</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map(req => {
            const cfg = statusConfig[req.status] || statusConfig.PENDING;
            const ride = rides[req.rideId];
            const requestPayment = payments.find(p => p.solicitud_viaje_id === req.id);
            const isFree = ride ? Number(ride.pricePerSeat) === 0 : true;

            return (
              <div key={req.id} className="mr-item flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Status and details */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    {ride && (
                      <span className="text-xs text-[#999]">
                        Costo: {isFree ? <span className="text-[#2d7a4f] font-semibold">Gratis</span> : <span className="text-[#c8a96e] font-semibold">${ride.pricePerSeat}</span>}
                      </span>
                    )}
                  </div>

                  {ride && (
                    <div className="space-y-1">
                      <p className="text-sm text-[#1a1a2e] font-medium">
                        {ride.originZone} <span className="text-gray-400">→</span> {ride.destinationZone}
                      </p>
                      {ride.originDetail && (
                        <p className="text-[#888] text-xs">
                          {ride.originDetail} {ride.destinationDetail ? `a ${ride.destinationDetail}` : ''}
                        </p>
                      )}
                      <p className="text-[#999] text-xs">
                        Salida: {ride.departureDate} a las {ride.departureTime}
                      </p>
                      <button
                        onClick={() => setViewRide(ride)}
                        className="text-xs text-[#c8a96e] hover:text-[#d4b87a] underline bg-transparent border-none cursor-pointer p-0 font-medium inline-flex items-center gap-1 mt-1"
                      >
                        📍 Ver ruta en el mapa
                      </button>
                    </div>
                  )}

                  {req.message && (
                    <div className="text-xs bg-[#fafaf8] p-2 border border-[#e8e4dc] rounded-sm text-[#666]">
                      <span className="font-semibold block text-[#6b6b6b] text-[10px] uppercase tracking-widest mb-0.5">Mensaje:</span>
                      "{req.message}"
                    </div>
                  )}

                  {req.status === 'REJECTED' && req.rejectReason && (
                    <div className="text-xs bg-[#fdf2f2] p-2 border border-[#f0b8b8] rounded-sm text-[#c0392b]">
                      <span className="font-semibold block text-[10px] uppercase tracking-widest mb-0.5">Motivo del rechazo:</span>
                      {req.rejectReason}
                    </div>
                  )}

                  {/* Payment Details for Accepted Requests */}
                  {req.status === 'ACCEPTED' && (
                    <div className="pt-2 border-t border-[#f0ece4] space-y-1">
                      {isFree ? (
                        <span className="text-xs text-[#2d7a4f] font-medium flex items-center gap-1">
                          🎁 Este viaje es gratuito, ¡disfrútalo!
                        </span>
                      ) : requestPayment ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#6b6b6b]">Estado del pago:</span>
                            {(() => {
                              const pCfg = paymentStatusConfig[requestPayment.estado] || { label: requestPayment.estado, bg: '#f5f3ef', color: '#1a1a2e' };
                              return (
                                <span className="status-badge text-[10px]" style={{ background: pCfg.bg, color: pCfg.color }}>
                                  {pCfg.label}
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-[11px] text-[#999]">
                            Método: <span className="font-medium">{methodLabel[requestPayment.metodo_pago] || requestPayment.metodo_pago}</span>
                            {requestPayment.referencia_transaccion && (
                              <span> · Ref: <span className="font-medium text-[#1a1a2e]">{requestPayment.referencia_transaccion}</span></span>
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-[#b45309] font-medium flex items-center gap-1">
                          ⚠️ Requiere registrar pago de ${ride?.pricePerSeat} para confirmar al conductor.
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-[#bbb] text-[10px]">
                    Solicitado el: {new Date(req.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                  {req.status === 'PENDING' && (
                    <button
                      onClick={() => cancelRequest(req.id)}
                      className="px-4 py-2 text-xs font-medium tracking-widest uppercase transition-colors duration-200"
                      style={{
                        background: '#fdf2f2',
                        color: '#c0392b',
                        border: '0.5px solid #f0b8b8',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Cancelar Solicitud
                    </button>
                  )}

                  {req.status === 'ACCEPTED' && !isFree && !requestPayment && (
                    <button
                      onClick={() => {
                        setSelectedRequestForPay(req);
                        setShowPayModal(true);
                      }}
                      className="px-4 py-2.5 text-xs font-semibold tracking-widest uppercase transition-all duration-200"
                      style={{
                        background: '#c8a96e',
                        color: '#1a1a2e',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      💳 Registrar Pago
                    </button>
                  )}

                  {req.status === 'ACCEPTED' && ride && (ride.status === 'IN_PROGRESS' || ride.status === 'COMPLETED') && (
                    <Link
                      to={`/tracking/${ride.id}`}
                      className="px-4 py-2 text-xs font-semibold tracking-widest uppercase text-center transition-colors duration-200"
                      style={{
                        background: '#1a1a2e',
                        color: '#ffffff',
                        borderRadius: '2px',
                        textDecoration: 'none',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      🚗 Ver Seguimiento
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal View Route Map */}
      {viewRide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(26,26,46,0.55)' }}
          onClick={() => setViewRide(null)}
        >
          <div
            className="w-full max-w-lg bg-white p-6 rounded"
            style={{ border: '0.5px solid #d8d4cc' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg tracking-wide" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
                Ruta del viaje
              </h2>
              <button onClick={() => setViewRide(null)} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-xl">✕</button>
            </div>
            
            <div className="mb-4 text-xs text-[#6b6b6b] space-y-1">
              <p><strong>Origen:</strong> {viewRide.originZone} {viewRide.originDetail ? `(${viewRide.originDetail})` : ''}</p>
              <p><strong>Destino:</strong> {viewRide.destinationZone} {viewRide.destinationDetail ? `(${viewRide.destinationDetail})` : ''}</p>
            </div>

            {(() => {
              const originCoords = getCoordinates(viewRide.originZone, viewRide.originLat, viewRide.originLng);
              const destCoords = getCoordinates(viewRide.destinationZone, viewRide.destinationLat, viewRide.destinationLng);

              return originCoords ? (
                <LiveMap
                  height="250px"
                  origin={originCoords ? { ...originCoords, label: viewRide.originZone } : null}
                  destination={destCoords ? { ...destCoords, label: viewRide.destinationZone } : null}
                />
              ) : (
                <div className="p-12 text-center text-xs text-[#999] bg-[#fafaf8] border border-[#e8e4dc]">
                  No hay coordenadas disponibles para renderizar el mapa
                </div>
              );
            })()}

            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewRide(null)} className="px-4 py-2 border border-[#d8d4cc] text-[#1a1a2e] hover:bg-[#fafaf8] text-xs font-semibold uppercase cursor-pointer rounded-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Pago */}
      {showPayModal && selectedRequestForPay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(26,26,46,0.55)' }}
          onClick={() => {
            if (!submittingPayment) {
              setShowPayModal(false);
              setSelectedRequestForPay(null);
              setPaymentReference('');
            }
          }}
        >
          <div
            className="w-full max-w-md bg-white overflow-hidden"
            style={{ borderRadius: '4px', border: '0.5px solid #d8d4cc' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#1a1a2e] px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-white text-lg tracking-wide" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
                  Registrar Pago
                </h3>
                <p className="text-[#8a8fa8] text-[10px] tracking-widest uppercase mt-0.5">U-Ride Payments</p>
              </div>
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setSelectedRequestForPay(null);
                  setPaymentReference('');
                }}
                disabled={submittingPayment}
                className="text-[#8a8fa8] hover:text-white transition-colors bg-transparent border-none cursor-pointer text-xl"
              >
                ✕
              </button>
            </div>
            <div className="w-full h-px bg-[#c8a96e] opacity-40" />

            {/* Body */}
            <form onSubmit={handleRegisterPayment} className="p-6 space-y-4">
              {paymentFeedback && (
                <div className="p-3 text-xs bg-[#fdf2f2] text-[#c0392b] border-l-2 border-[#c0392b] rounded-sm">
                  {paymentFeedback}
                </div>
              )}

              {/* Detalle del viaje y costo */}
              <div className="p-4 bg-[#fafaf8] border border-[#e8e4dc] space-y-2" style={{ borderRadius: '2px' }}>
                <p className="text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase">Viaje Compartido</p>
                {(() => {
                  const ride = rides[selectedRequestForPay.rideId];
                  return (
                    <div className="text-xs text-[#1a1a2e] space-y-1">
                      <p className="font-medium">Ruta: {ride?.originZone} → {ride?.destinationZone}</p>
                      <p>Fecha y Hora: {ride?.departureDate} a las {ride?.departureTime}</p>
                      <div className="pt-2 border-t border-[#e8e4dc] flex justify-between items-center mt-1">
                        <span className="font-semibold text-[#6b6b6b]">Monto a pagar:</span>
                        <span className="text-base font-bold text-[#c8a96e]">
                          ${Number(ride?.pricePerSeat).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Método de pago */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase">Método de Pago *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: 'Efectivo', desc: 'Pago directo' },
                    { id: 'TRANSFER', label: 'Transferencia', desc: 'Bancaria' },
                    { id: 'WALLET', label: 'Billetera', desc: 'Deuna/Aki/etc' },
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as any)}
                      className="px-3 py-2.5 text-center flex flex-col items-center justify-center transition-all duration-200 border cursor-pointer rounded-sm"
                      style={{
                        background: paymentMethod === method.id ? '#fdf8f0' : '#fafaf8',
                        borderColor: paymentMethod === method.id ? '#c8a96e' : '#d8d4cc',
                      }}
                    >
                      <span className="text-xs font-semibold text-[#1a1a2e]">{method.label}</span>
                      <span className="text-[9px] text-[#999] mt-0.5">{method.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Referencia de transacción si no es efectivo */}
              {paymentMethod !== 'CASH' && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-[#6b6b6b] tracking-widest uppercase">Referencia / Comprobante *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. # de transferencia o lote"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ccc] text-[#1a1a2e] text-sm bg-[#fafaf8] outline-none transition-colors duration-200 focus:border-[#1a1a2e] focus:bg-white placeholder-[#bbb]"
                    style={{ borderRadius: '2px', fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex-1 px-4 py-2.5 text-xs font-medium tracking-widest uppercase text-white bg-[#1a1a2e] hover:bg-[#2d2d4e] transition-colors border-none cursor-pointer rounded-sm"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {submittingPayment ? 'Registrando...' : 'Confirmar Pago'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPayModal(false);
                    setSelectedRequestForPay(null);
                    setPaymentReference('');
                  }}
                  disabled={submittingPayment}
                  className="px-4 py-2.5 text-xs font-medium tracking-widest uppercase text-[#1a1a2e] bg-[#fafaf8] hover:bg-[#e8e4dc] transition-colors border border-[#d8d4cc] cursor-pointer rounded-sm"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Inline SVG icon ── */
const InboxIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
);