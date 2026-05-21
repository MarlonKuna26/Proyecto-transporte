import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import type { Payment, PaymentSummary } from '@/types';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'sent' | 'received'>('sent');
  const [sentPayments, setSentPayments] = useState<Payment[]>([]);
  const [receivedPayments, setReceivedPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ msg: '', type: '' });

  // Custom Modal States
  const [confirmPaymentId, setConfirmPaymentId] = useState<string | null>(null);
  const [refundPaymentId, setRefundPaymentId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sent, received, sum] = await Promise.all([
        api.payments.myPayments(),
        api.payments.received(),
        api.payments.summary(),
      ]);
      setSentPayments(sent.data || []);
      setReceivedPayments(received.data || []);
      setSummary(sum.data);
    } catch { }
    setLoading(false);
  };

  const executeConfirmPayment = async () => {
    if (!confirmPaymentId) return;
    try {
      await api.payments.confirm(confirmPaymentId);
      setFeedback({ msg: 'Pago confirmado exitosamente', type: 'success' });
      setConfirmPaymentId(null);
      loadData();
      setTimeout(() => setFeedback({ msg: '', type: '' }), 4000);
    } catch (err: any) {
      setFeedback({ msg: err.message, type: 'error' });
      setConfirmPaymentId(null);
    }
  };

  const executeRefundPayment = async () => {
    if (!refundPaymentId) return;
    try {
      await api.payments.refund(refundPaymentId);
      setFeedback({ msg: 'Pago reembolsado correctamente', type: 'success' });
      setRefundPaymentId(null);
      loadData();
      setTimeout(() => setFeedback({ msg: '', type: '' }), 4000);
    } catch (err: any) {
      setFeedback({ msg: err.message, type: 'error' });
      setRefundPaymentId(null);
    }
  };

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    PENDING:   { label: 'Pendiente',   bg: '#FFF3E0', color: '#FF6937' },
    COMPLETED: { label: 'Completado',  bg: '#E6F4EA', color: '#06C167' },
    REFUNDED:  { label: 'Reembolsado', bg: '#E8F0FE', color: '#276EF1' },
    FAILED:    { label: 'Fallido',     bg: '#FDECEA', color: '#E11900' },
  };

  const methodLabel: Record<string, string> = {
    CASH:     'Efectivo',
    TRANSFER: 'Transferencia',
    WALLET:   'Billetera',
  };

  const summaryCards = summary ? [
    { label: 'Total pagado',      value: `$${Number(summary.sent.monto_total).toLocaleString()}`,                                         icon: <ArrowUpIcon />,    color: 'text-uber-green bg-green-50' },
    { label: 'Total recibido',    value: `$${Number(summary.received.monto_total).toLocaleString()}`,                                     icon: <ArrowDownIcon />,  color: 'text-black bg-uber-gray-50' },
    { label: 'Pagos pendientes',  value: String(summary.sent.pendientes),                                                                 icon: <ClockIcon />,      color: 'text-amber-500 bg-amber-50' },
    { label: 'Pagos completados', value: String(Number(summary.sent.completados) + Number(summary.received.completados)),                 icon: <CheckIcon />,      color: 'text-black bg-uber-gray-50' },
  ] : [];

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-uber-gray-100 p-6 rounded-2xl animate-pulse space-y-3">
          <div className="h-4 bg-uber-gray-100 rounded w-1/3" />
          <div className="h-3 bg-uber-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );

  const payments = tab === 'sent' ? sentPayments : receivedPayments;
  const currentConfirmPayment = payments.find(p => p.id === confirmPaymentId);
  const currentRefundPayment = payments.find(p => p.id === refundPaymentId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ PAGE HEADER ═══ */}
      <div className="pb-4 border-b border-uber-gray-100">
        <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
          Mis pagos
        </h1>
        <p className="text-sm text-uber-gray-500 mt-1">
          Historial de transacciones enviadas y recibidas dentro de la plataforma
        </p>
      </div>

      {/* ═══ FEEDBACK NOTIFICATIONS ═══ */}
      {feedback.msg && (
        <div
          className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl border animate-fade-in ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-uber-green font-semibold'
              : 'border-red-200 bg-red-50 text-uber-red font-semibold'
          }`}
        >
          {feedback.type === 'success' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          )}
          <span>{feedback.msg}</span>
          <button
            onClick={() => setFeedback({ msg: '', type: '' })}
            className="ml-auto text-current opacity-60 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer text-base"
          >
            ✕
          </button>
        </div>
      )}

      {/* ═══ SUMMARY CARDS ═══ */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          {summaryCards.map((c, i) => (
            <div key={i} className="bg-white border border-uber-gray-100 rounded-2xl p-5 shadow-uber-sm">
              <div className={`w-10 h-10 flex items-center justify-center mb-3 rounded-xl ${c.color}`}>
                {c.icon}
              </div>
              <p className="text-black text-2xl font-black tracking-tight">{c.value}</p>
              <p className="text-uber-gray-500 text-xs mt-1 font-semibold">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ═══ TABS ═══ */}
      <div className="flex border-b border-uber-gray-100 gap-6">
        <button
          className={`pb-3 text-sm font-bold transition-all relative border-none bg-transparent cursor-pointer ${
            tab === 'sent' ? 'text-black' : 'text-uber-gray-400 hover:text-black'
          }`}
          onClick={() => setTab('sent')}
        >
          Enviados ({sentPayments.length})
          {tab === 'sent' && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black rounded-full" />
          )}
        </button>
        <button
          className={`pb-3 text-sm font-bold transition-all relative border-none bg-transparent cursor-pointer ${
            tab === 'received' ? 'text-black' : 'text-uber-gray-400 hover:text-black'
          }`}
          onClick={() => setTab('received')}
        >
          Recibidos ({receivedPayments.length})
          {tab === 'received' && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black rounded-full" />
          )}
        </button>
      </div>

      {/* ═══ PAYMENTS LIST ═══ */}
      {payments.length === 0 ? (
        <div className="bg-white border border-uber-gray-100 rounded-3xl p-12 text-center max-w-xl mx-auto my-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-uber-gray-50 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBCBCB" strokeWidth="1.5">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-black mb-2">No hay pagos {tab === 'sent' ? 'enviados' : 'recibidos'}</h3>
          <p className="text-sm text-uber-gray-500 max-w-xs mx-auto">
            Las transacciones realizadas aparecerán listadas en esta sección.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(payment => {
            const cfg = statusConfig[payment.estado] || statusConfig.PENDING;
            return (
              <div
                key={payment.id}
                className="bg-white rounded-2xl p-5 border border-uber-gray-100 shadow-uber-sm hover:shadow-uber-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in"
              >
                <div className="flex-1 space-y-3">
                  {/* Top row: Status and Method */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-xs font-semibold text-black bg-uber-gray-50 px-2 py-0.5 rounded">
                      {methodLabel[payment.metodo_pago] || payment.metodo_pago}
                    </span>
                  </div>

                  {/* Route Dot-Line-Square */}
                  {payment.zona_origen ? (
                    <div className="flex gap-2.5 my-2">
                      <div className="flex flex-col items-center gap-1.5 mt-1 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-black" />
                        <div className="w-0.5 h-6 bg-uber-gray-200" />
                        <div className="w-2 h-2 bg-black" style={{ borderRadius: '1.5px' }} />
                      </div>
                      <div className="min-w-0 text-xs">
                        <div className="font-bold text-black truncate leading-none">{payment.zona_origen}</div>
                        <div className="h-3" />
                        <div className="font-bold text-black truncate leading-none">{payment.zona_destino}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-uber-gray-400 font-semibold italic">Ruta no especificada en el pago</p>
                  )}

                  {/* Pasajero o Conductor */}
                  {payment.nombre_pasajero && tab === 'received' && (
                    <div className="flex items-center gap-1.5 text-xs text-uber-gray-600 pl-1 font-semibold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span>Pasajero: <span className="text-black font-bold">{payment.nombre_pasajero}</span></span>
                    </div>
                  )}

                  {/* Transaction metadata */}
                  <div className="space-y-1 pl-1">
                    {payment.referencia_transaccion && (
                      <p className="text-[10px] text-uber-gray-400 font-semibold">Ref: <span className="text-uber-gray-600">{payment.referencia_transaccion}</span></p>
                    )}
                    <p className="text-[10px] text-uber-gray-400 font-medium">
                      Realizado el {new Date(payment.creado_en).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Right Column: Amount & Actions */}
                <div className="flex flex-row md:flex-col md:items-end justify-between items-center md:justify-start gap-4 shrink-0 text-right">
                  <div>
                    <div className="text-[10px] text-uber-gray-400 font-bold uppercase tracking-wider leading-none">Monto</div>
                    <div className="text-2xl font-black text-black mt-0.5 leading-none">
                      ${Number(payment.monto).toLocaleString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {tab === 'received' && payment.estado === 'PENDING' && (
                      <button
                        onClick={() => setConfirmPaymentId(payment.id)}
                        className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-uber-gray-800 transition-colors rounded-xl border-none cursor-pointer shadow-sm"
                      >
                        Confirmar
                      </button>
                    )}
                    {payment.estado === 'COMPLETED' && (
                      <button
                        onClick={() => setRefundPaymentId(payment.id)}
                        className="px-4 py-2 text-xs font-semibold text-uber-gray-700 bg-uber-gray-50 hover:bg-uber-gray-100 border border-uber-gray-200 hover:border-uber-gray-300 rounded-xl transition-all cursor-pointer"
                      >
                        Reembolsar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CUSTOM MODAL: CONFIRM PAYMENT RECEIVED ═══ */}
      {confirmPaymentId && currentConfirmPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile">
            {/* Header */}
            <div className="bg-black text-white px-6 py-5 shrink-0">
              <h3 className="text-lg font-bold">¿Confirmar recepción de pago?</h3>
              <p className="text-xs text-uber-gray-400 mt-0.5">Valida el cobro antes de marcarlo como completado</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-green-50 border border-green-200 rounded-full text-uber-green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black">¿Has recibido el pago correctamente?</h4>
                  <p className="text-xs text-uber-gray-500 mt-1 leading-relaxed">
                    Confirmas que el pasajero <span className="font-bold text-black">{currentConfirmPayment.nombre_pasajero || 'Usuario'}</span> te ha transferido o entregado en efectivo la suma de:
                  </p>
                  <p className="text-2xl font-black text-black mt-2 leading-none">
                    ${Number(currentConfirmPayment.monto).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-uber-gray-100">
                <button
                  onClick={executeConfirmPayment}
                  className="flex-1 py-3 text-sm font-bold text-white bg-black hover:bg-uber-gray-800 transition-colors rounded-xl border-none cursor-pointer"
                >
                  Sí, Confirmar
                </button>
                <button
                  onClick={() => setConfirmPaymentId(null)}
                  className="flex-1 py-3 text-sm font-semibold bg-uber-gray-50 hover:bg-uber-gray-100 text-black border border-uber-gray-200 rounded-xl transition-all cursor-pointer"
                >
                  Regresar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CUSTOM MODAL: REFUND PAYMENT CONFIRMATION ═══ */}
      {refundPaymentId && currentRefundPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile">
            {/* Header */}
            <div className="bg-black text-white px-6 py-5 shrink-0">
              <h3 className="text-lg font-bold">¿Reembolsar pago realizado?</h3>
              <p className="text-xs text-uber-gray-400 mt-0.5">Esta acción devolverá los fondos del viaje</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-red-50 border border-red-200 rounded-full text-uber-red">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black">¿Confirmas el reembolso del dinero?</h4>
                  <p className="text-xs text-uber-gray-500 mt-1 leading-relaxed">
                    Se procesará un reembolso por el valor total de:
                  </p>
                  <p className="text-2xl font-black text-uber-red mt-2 leading-none">
                    ${Number(currentRefundPayment.monto).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-uber-gray-400 font-semibold mt-1">
                    Esta operación marcará la transacción como Reembolsada y es irreversible.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-uber-gray-100">
                <button
                  onClick={executeRefundPayment}
                  className="flex-1 py-3 text-sm font-bold text-white bg-uber-red hover:bg-red-700 transition-colors rounded-xl border-none cursor-pointer"
                >
                  Sí, Reembolsar
                </button>
                <button
                  onClick={() => setRefundPaymentId(null)}
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

/* ── Inline SVG icons ── */
const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const ArrowDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);