import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import type { RideRequest, Ride } from '@/types';
import { Link } from 'react-router-dom';

export const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [ridesMap, setRidesMap] = useState<Record<string, Ride>>({});
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  // FILTROS
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Custom Modal State for Cancellation
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.rideRequests.myRequests();
        const requestList: RideRequest[] = res.data || [];
        setRequests(requestList);

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

      setFeedback('Solicitud cancelada con éxito');
      setCancelRequestId(null);

      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      setFeedback(err.message);
      setCancelRequestId(null);
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


      {/* ═══ FEEDBACK NOTIFICATION ═══ */}
      {feedback && (
        <div className="flex items-center gap-3 px-4 py-3 text-sm rounded-xl border border-green-200 bg-green-50 text-uber-green animate-fade-in">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>

          <span className="font-semibold">{feedback}</span>
        </div>
      )}

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
                    {req.message && (
                      <div className="bg-uber-gray-50 border border-uber-gray-100 rounded-xl px-4 py-2.5 max-w-xl">
                        <span className="block text-[9px] text-uber-gray-400 font-bold uppercase tracking-wider mb-0.5">
                          Tu mensaje
                        </span>

                        <p className="text-xs text-uber-gray-700 font-medium leading-relaxed">
                          "{req.message}"
                        </p>
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
                    {req.status === 'PENDING' && (
                      <button
                        onClick={() => setCancelRequestId(req.id)}
                        className="px-4 py-2.5 text-xs font-bold text-uber-red bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded-xl transition-all self-start md:self-auto cursor-pointer"
                      >
                        Cancelar solicitud
                      </button>
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
    </div>
  );
};