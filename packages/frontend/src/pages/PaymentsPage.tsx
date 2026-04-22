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

  const confirmPayment = async (id: string) => {
    try {
      await api.payments.confirm(id);
      setFeedback({ msg: 'Pago confirmado exitosamente', type: 'success' });
      loadData();
    } catch (err: any) {
      setFeedback({ msg: err.message, type: 'error' });
    }
  };

  const refundPayment = async (id: string) => {
    try {
      await api.payments.refund(id);
      setFeedback({ msg: 'Pago reembolsado', type: 'success' });
      loadData();
    } catch (err: any) {
      setFeedback({ msg: err.message, type: 'error' });
    }
  };

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    PENDING:   { label: 'Pendiente',   bg: '#fdf8f0', color: '#8a6a2e' },
    COMPLETED: { label: 'Completado',  bg: '#f0faf4', color: '#2d7a4f' },
    REFUNDED:  { label: 'Reembolsado', bg: '#f0f4fa', color: '#2d4f7a' },
    FAILED:    { label: 'Fallido',     bg: '#fdf2f2', color: '#c0392b' },
  };

  const methodLabel: Record<string, string> = {
    CASH:     'Efectivo',
    TRANSFER: 'Transferencia',
    WALLET:   'Billetera',
  };

  const summaryCards = summary ? [
    { label: 'Total pagado',      value: `$${Number(summary.sent.monto_total).toLocaleString()}`,                                         icon: <ArrowUpIcon />,    accent: '#c8a96e' },
    { label: 'Total recibido',    value: `$${Number(summary.received.monto_total).toLocaleString()}`,                                     icon: <ArrowDownIcon />,  accent: '#1a1a2e' },
    { label: 'Pagos pendientes',  value: String(summary.sent.pendientes),                                                                 icon: <ClockIcon />,      accent: '#c8a96e' },
    { label: 'Pagos completados', value: String(Number(summary.sent.completados) + Number(summary.received.completados)),                 icon: <CheckIcon />,      accent: '#1a1a2e' },
  ] : [];

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4 px-4 py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-[#d8d4cc] p-6" style={{ borderRadius: '4px' }}>
          <div className="h-3 bg-[#e8e4dc] rounded w-3/4 mb-3" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div className="h-2.5 bg-[#e8e4dc] rounded w-1/2" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      ))}
    </div>
  );

  const payments = tab === 'sent' ? sentPayments : receivedPayments;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .pay-card { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; }
        .pay-item { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; padding:1.25rem; transition:border-color 0.2s; }
        .pay-item:hover { border-color:#1a1a2e; }
        .status-badge { font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; padding:3px 10px; border-radius:2px; }
        .section-label { font-size:11px; font-weight:500; color:#6b6b6b; letter-spacing:0.1em; text-transform:uppercase; }
        .tab-btn { padding:10px 20px; font-size:12px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; border:0.5px solid #d8d4cc; background:#fff; color:#6b6b6b; cursor:pointer; border-radius:2px; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        .tab-btn.active { background:#1a1a2e; color:#fff; border-color:#1a1a2e; }
        .tab-btn:not(.active):hover { border-color:#c8a96e; color:#c8a96e; }
        .action-btn { padding:8px 14px; font-size:11px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; border:0.5px solid; cursor:pointer; border-radius:2px; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      {/* Page header */}
      <div className="pay-card overflow-hidden">
        <div className="bg-[#1a1a2e] px-8 py-6">
          <h1 className="text-2xl text-white tracking-wide" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
            Mis pagos
          </h1>
          <p className="text-[#8a8fa8] text-xs tracking-widest uppercase mt-1">
            Historial de transacciones · U-Ride
          </p>
        </div>
        <div className="w-full h-px bg-[#c8a96e] opacity-40" />
      </div>

      {/* Feedback */}
      {feedback.msg && (
        <div
          className="flex items-center gap-3 px-4 py-3 text-sm"
          style={{
            background: feedback.type === 'success' ? '#f0faf4' : '#fdf2f2',
            borderLeft: `3px solid ${feedback.type === 'success' ? '#2d7a4f' : '#c0392b'}`,
            color: feedback.type === 'success' ? '#2d7a4f' : '#c0392b',
            borderRadius: '0 2px 2px 0',
          }}
        >
          <span>{feedback.msg}</span>
          <button
            onClick={() => setFeedback({ msg: '', type: '' })}
            className="ml-auto text-current opacity-50 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer text-base"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryCards.map((c, i) => (
            <div key={i} className="pay-card p-5">
              <div
                className="w-9 h-9 flex items-center justify-center mb-3"
                style={{ background: c.accent === '#c8a96e' ? '#fdf8f0' : '#f0f0f5', borderRadius: '2px' }}
              >
                {c.icon}
              </div>
              <p className="text-[#1a1a2e] text-xl font-medium">{c.value}</p>
              <p className="text-[#999] text-xs mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button className={`tab-btn${tab === 'sent' ? ' active' : ''}`} onClick={() => setTab('sent')}>
          Enviados ({sentPayments.length})
        </button>
        <button className={`tab-btn${tab === 'received' ? ' active' : ''}`} onClick={() => setTab('received')}>
          Recibidos ({receivedPayments.length})
        </button>
      </div>

      {/* Payments list */}
      {payments.length === 0 ? (
        <div className="pay-card p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#fdf8f0] mb-4" style={{ borderRadius: '2px' }}>
            <CardIcon />
          </div>
          <p className="text-[#999] text-sm">No hay pagos {tab === 'sent' ? 'enviados' : 'recibidos'}</p>
          <p className="text-[#bbb] text-xs mt-1">Las transacciones aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map(payment => {
            const cfg = statusConfig[payment.estado] || statusConfig.PENDING;
            return (
              <div key={payment.id} className="pay-item">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">

                    {/* Top row */}
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="status-badge"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-[#c8a96e] font-medium text-base">
                        ${Number(payment.monto).toLocaleString()}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#999] text-xs">
                      {payment.zona_origen && (
                        <span className="flex items-center gap-1">
                          <span style={{ color: '#c8a96e' }}>●</span>
                          {payment.zona_origen} → {payment.zona_destino}
                        </span>
                      )}
                      {payment.fecha_salida && <span>{payment.fecha_salida}</span>}
                      <span>{methodLabel[payment.metodo_pago] || payment.metodo_pago}</span>
                      {payment.nombre_pasajero && tab === 'received' && (
                        <span>{payment.nombre_pasajero}</span>
                      )}
                    </div>

                    {payment.referencia_transaccion && (
                      <p className="text-[#bbb] text-xs mt-1">Ref: {payment.referencia_transaccion}</p>
                    )}
                    <p className="text-[#bbb] text-xs mt-0.5">
                      {new Date(payment.creado_en).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {tab === 'received' && payment.estado === 'PENDING' && (
                      <button
                        onClick={() => confirmPayment(payment.id)}
                        className="action-btn"
                        style={{ background: '#f0faf4', color: '#2d7a4f', borderColor: '#a8d5bc' }}
                      >
                        Confirmar
                      </button>
                    )}
                    {payment.estado === 'COMPLETED' && (
                      <button
                        onClick={() => refundPayment(payment.id)}
                        className="action-btn"
                        style={{ background: '#fafaf8', color: '#6b6b6b', borderColor: '#d8d4cc' }}
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
    </div>
  );
};

/* ── Inline SVG icons ── */
const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const ArrowDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const CardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);