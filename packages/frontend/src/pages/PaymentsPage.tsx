import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ToastContainer, type ToastMessage } from '@/components/Toast';
import type { Payment, PaymentSummary } from '@/types';
import {
  Wallet,
  ArrowDownLeft,
  Clock3,
  BadgeCheck,
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'sent' | 'received'>('sent');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED'>('ALL');
  const [sentPayments, setSentPayments] = useState<Payment[]>([]);
  const [receivedPayments, setReceivedPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;


  // ===== TOAST FUNCTIONS =====
  const addToast = (msg: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { id, msg, type, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

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
      addToast('Pago confirmado exitosamente', 'success');
      setConfirmPaymentId(null);
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Error al confirmar el pago', 'error');
      setConfirmPaymentId(null);
    }
  };

  const executeRefundPayment = async () => {
    if (!refundPaymentId) return;
    try {
      await api.payments.refund(refundPaymentId);
      addToast('Pago reembolsado correctamente', 'success');
      setRefundPaymentId(null);
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Error al reembolsar el pago', 'error');
      setRefundPaymentId(null);
    }
  };

  const statusConfig: Record<string, { label: string; border: string; text: string; bg: string }> = {
    PENDING:   { label: 'Pendiente',   border: 'border-amber-500',   text: 'text-black',   bg: 'bg-white' },
    COMPLETED: { label: 'Completado',  border: 'border-emerald-500', text: 'text-black', bg: 'bg-white' },
    REFUNDED:  { label: 'Reembolsado', border: 'border-blue-500',    text: 'text-black',    bg: 'bg-white' },
    FAILED:    { label: 'Fallido',     border: 'border-red-500',     text: 'text-black',     bg: 'bg-white' },
  };

  const methodLabel: Record<string, string> = {
    CASH:     'Efectivo',
    TRANSFER: 'Transferencia',
    WALLET:   'Billetera',
  };

  const summaryCards = summary ? [
{
    label: 'Total pagado',
    value: `$${Number(summary.sent.monto_total).toLocaleString()}`,
    icon: <Wallet size={20} strokeWidth={2.5} />,
    color: 'bg-white border border-emerald-500 text-black',
  },
       {
    label: 'Total recibido',
    value: `$${Number(summary.received.monto_total).toLocaleString()}`,
    icon: <ArrowDownLeft size={20} strokeWidth={2.5} />,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Pagos pendientes',
    value: String(summary.sent.pendientes),
    icon: <Clock3 size={20} strokeWidth={2.5} />,
    color: 'bg-white border border-amber-500 text-black',
  },
  {
    label: 'Pagos completados',
    value: String(
      Number(summary.sent.completados) +
      Number(summary.received.completados)
    ),
    icon: <BadgeCheck size={20} strokeWidth={2.5} />,
    color: 'bg-white border border-purple-500 text-black',
  },] : [];

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

  const allPayments = tab === 'sent' ? sentPayments : receivedPayments;

  const payments =
    statusFilter === 'ALL'
      ? allPayments
      : allPayments.filter(p => p.estado === statusFilter);

  const totalPages = Math.ceil(payments.length / pageSize);
  const paginatedPayments = payments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const currentConfirmPayment = payments.find(p => p.id === confirmPaymentId);
  const currentRefundPayment = payments.find(p => p.id === refundPaymentId);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ PAGE HEADER ═══ */}
      <div className="pb-4 border-b border-uber-gray-100">
        <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
          Mis pagos
        </h1>
        <p className="text-sm text-uber-gray-500 mt-1">
          Historial de transacciones enviadas y recibidas dentro de la plataforma
        </p>
      </div>

      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      <ToastContainer messages={messages} onClose={removeToast} />

      {/* ═══ SUMMARY CARDS ═══ */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          {summaryCards.map((c, i) => (
<div
  key={i}
  className="bg-white border border-uber-gray-100 rounded-3xl p-5 shadow-uber-sm hover:shadow-uber-md transition-all duration-300 hover:-translate-y-1"
><div
  className={`w-12 h-12 flex items-center justify-center mb-4 rounded-2xl ${c.color}`}
>                {c.icon}
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
          onClick={() => {
            setTab('sent');
            setCurrentPage(1);
          }}
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
          onClick={() => {
            setTab('received');
            setCurrentPage(1);
          }}
        >
          Recibidos ({receivedPayments.length})
          {tab === 'received' && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black rounded-full" />
          )}
        </button>
      </div>
{/* ═══ STATUS FILTERS ═══ */}
<div className="flex gap-2 overflow-x-auto pb-1 animate-fade-in">
  {[
    { key: 'ALL', label: 'Todos' },
    { key: 'PENDING', label: 'Pendientes' },
    { key: 'COMPLETED', label: 'Completados' },
    { key: 'REFUNDED', label: 'Reembolsados' },
    { key: 'FAILED', label: 'Fallidos' },
  ].map(filter => {
    const active = statusFilter === filter.key;

    return (
      <button
        key={filter.key}
        onClick={() => {
          setStatusFilter(filter.key as any);
          setCurrentPage(1);
        }}
        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer
          ${
            active
              ? 'bg-black text-white border-black shadow-sm'
              : 'bg-white text-uber-gray-500 border-uber-gray-200 hover:border-black hover:text-black'
          }`}
      >
        {filter.label}
      </button>
    );
  })}
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedPayments.map(payment => {
              const cfg = statusConfig[payment.estado] || statusConfig.PENDING;
              return (
                <div
                  key={payment.id}
                  className="bg-white rounded-2xl p-6 border border-uber-gray-100 shadow-uber-sm hover:shadow-uber-md transition-all duration-200 flex flex-col justify-between gap-4 animate-fade-in min-h-[200px]"
                >
                  <div className="space-y-3">
                    {/* Top row: Status and Method */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap border shadow-sm ${cfg.bg} ${cfg.border} ${cfg.text}`}
                      >
                        {cfg.label}
                      </span>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm bg-white border ${
                        payment.metodo_pago === 'CASH' ? 'text-black border-emerald-500' : 
                        payment.metodo_pago === 'PAYPAL' ? 'text-black border-black font-black' : 
                        'text-black border-blue-500'
                      }`}>
                        {payment.metodo_pago === 'CASH' ? '💵 Efectivo' : 
                         payment.metodo_pago === 'PAYPAL' ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> PayPal</> : 
                         '🏦 Transferencia'}
                      </span>
                      {payment.comprobante_url && (
                        <button 
                          onClick={() => window.open(payment.comprobante_url!, '_blank')}
                          className="text-[10px] font-bold text-zinc-600 bg-white px-2 py-1 rounded-lg flex items-center gap-1 border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-colors"
                        >
                          📎 Ver comprobante
                        </button>
                      )}
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
                  <div className="flex items-center justify-between pt-3 border-t border-uber-gray-100 mt-auto">
                    <div>
                      <div className="text-[10px] text-uber-gray-400 font-bold uppercase tracking-wider leading-none">Monto</div>
                      <div className="text-xl font-black text-black mt-1 leading-none">
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
                      {/* No refund button as per user request */}
                    </div>
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

      {/* ═══ CUSTOM MODAL: CONFIRM PAYMENT RECEIVED ═══ */}
      {confirmPaymentId && currentConfirmPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-black text-white px-6 py-5 shrink-0">
              <h3 className="text-lg font-bold">¿Confirmar recepción de pago?</h3>
              <p className="text-xs text-uber-gray-400 mt-0.5">Valida el cobro antes de marcarlo como completado</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-white border border-emerald-500 rounded-full text-black">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-black">¿Has recibido el pago correctamente?</h4>
                  <p className="text-xs text-uber-gray-500 mt-1 leading-relaxed">
                    Confirmas que el pasajero <span className="font-bold text-black">{currentConfirmPayment.nombre_pasajero || 'Usuario'}</span> te ha transferido o entregado en efectivo la suma de:
                  </p>
                  <p className="text-2xl font-black text-black mt-2 leading-none">
                    ${Number(currentConfirmPayment.monto).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Show comprobante if present */}
              {currentConfirmPayment.comprobante_url && (
                <div className="space-y-2 pt-3 border-t border-uber-gray-100">
                  <span className="text-xs font-bold text-uber-gray-400 uppercase tracking-wider block">Comprobante Cargado</span>
                  <div className="rounded-2xl overflow-hidden border border-uber-gray-200 bg-uber-gray-50 p-2 text-center">
                    <img
                      src={currentConfirmPayment.comprobante_url}
                      alt="Comprobante de pago"
                      className="w-full max-h-60 object-contain rounded-xl"
                    />
                    <a
                      href={currentConfirmPayment.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      🔍 Ver imagen en pantalla completa
                    </a>
                  </div>
                </div>
              )}

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
                <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-zinc-50 border border-zinc-200 rounded-full text-black">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black">¿Confirmas el reembolso del dinero?</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Se procesará un reembolso por el valor total de:
                  </p>
                  <p className="text-2xl font-black text-black mt-2 leading-none">
                    ${Number(currentRefundPayment.monto).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-1">
                    Esta operación marcará la transacción como Reembolsada y es irreversible.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                <button
                  onClick={executeRefundPayment}
                  className="flex-1 py-3 text-sm font-bold text-white bg-black hover:bg-zinc-800 transition-colors rounded-xl border-none cursor-pointer"
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