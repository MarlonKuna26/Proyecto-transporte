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

  const statusConfig: Record<string, { label: string; class: string; icon: string }> = {
    PENDING: { label: 'Pendiente', class: 'badge-warning', icon: '⏳' },
    COMPLETED: { label: 'Completado', class: 'badge-success', icon: '✅' },
    REFUNDED: { label: 'Reembolsado', class: 'badge-info', icon: '↩️' },
    FAILED: { label: 'Fallido', class: 'badge-danger', icon: '❌' },
  };

  const methodLabel: Record<string, string> = {
    CASH: '💵 Efectivo',
    TRANSFER: '🏦 Transferencia',
    WALLET: '👛 Billetera',
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="glass-card p-6 animate-pulse">
          <div className="h-4 bg-dark-200 rounded w-3/4 mb-3" />
          <div className="h-3 bg-dark-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );

  const payments = tab === 'sent' ? sentPayments : receivedPayments;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-navy-900">💰 Mis pagos</h1>

      {feedback.msg && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-primary-50 border border-primary-200 text-primary-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <span>{feedback.type === 'success' ? '✅' : '❌'}</span> {feedback.msg}
          <button onClick={() => setFeedback({ msg: '', type: '' })} className="ml-auto text-dark-400">✕</button>
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-xl mb-2 shadow-blue">📤</div>
            <p className="text-2xl font-bold text-navy-900">${Number(summary.sent.monto_total).toLocaleString()}</p>
            <p className="text-dark-400 text-xs">Total pagado</p>
          </div>
          <div className="glass-card p-4">
            <div className="w-10 h-10 rounded-xl bg-navy-500 flex items-center justify-center text-xl mb-2 shadow-blue">📥</div>
            <p className="text-2xl font-bold text-navy-900">${Number(summary.received.monto_total).toLocaleString()}</p>
            <p className="text-dark-400 text-xs">Total recibido</p>
          </div>
          <div className="glass-card p-4">
            <div className="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center text-xl mb-2 shadow-blue">⏳</div>
            <p className="text-2xl font-bold text-navy-900">{summary.sent.pendientes}</p>
            <p className="text-dark-400 text-xs">Pagos pendientes</p>
          </div>
          <div className="glass-card p-4">
            <div className="w-10 h-10 rounded-xl bg-navy-700 flex items-center justify-center text-xl mb-2 shadow-blue">✅</div>
            <p className="text-2xl font-bold text-navy-900">{Number(summary.sent.completados) + Number(summary.received.completados)}</p>
            <p className="text-dark-400 text-xs">Pagos completados</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('sent')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'sent' ? 'bg-primary-500 text-white shadow-blue' : 'text-dark-500 bg-white border border-primary-100 hover:bg-primary-50'}`}>
          📤 Pagos enviados ({sentPayments.length})
        </button>
        <button onClick={() => setTab('received')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'received' ? 'bg-primary-500 text-white shadow-blue' : 'text-dark-500 bg-white border border-primary-100 hover:bg-primary-50'}`}>
          📥 Pagos recibidos ({receivedPayments.length})
        </button>
      </div>

      {/* Payments list */}
      {payments.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-5xl mb-4">💳</p>
          <p className="text-dark-500 text-lg">No hay pagos {tab === 'sent' ? 'enviados' : 'recibidos'}</p>
          <p className="text-dark-400 text-sm mt-2">Los pagos aparecerán aquí cuando se realicen transacciones</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(payment => {
            const cfg = statusConfig[payment.estado] || statusConfig.PENDING;
            return (
              <div key={payment.id} className="glass-card p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{cfg.icon}</span>
                      <span className={cfg.class}>{cfg.label}</span>
                      <span className="text-primary-600 font-bold text-lg">${Number(payment.monto).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-dark-500 text-xs ml-8">
                      {payment.zona_origen && (
                        <span>📍 {payment.zona_origen} → {payment.zona_destino}</span>
                      )}
                      {payment.fecha_salida && <span>📅 {payment.fecha_salida}</span>}
                      <span>{methodLabel[payment.metodo_pago] || payment.metodo_pago}</span>
                      {payment.nombre_pasajero && tab === 'received' && (
                        <span>👤 {payment.nombre_pasajero}</span>
                      )}
                    </div>
                    {payment.referencia_transaccion && (
                      <p className="text-dark-400 text-xs ml-8 mt-1">Ref: {payment.referencia_transaccion}</p>
                    )}
                    <p className="text-dark-300 text-xs ml-8 mt-1">
                      {new Date(payment.creado_en).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-8 md:ml-0">
                    {tab === 'received' && payment.estado === 'PENDING' && (
                      <button onClick={() => confirmPayment(payment.id)}
                        className="px-4 py-2 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 transition-colors">
                        ✅ Confirmar
                      </button>
                    )}
                    {payment.estado === 'COMPLETED' && (
                      <button onClick={() => refundPayment(payment.id)}
                        className="px-4 py-2 rounded-lg bg-dark-100 text-dark-500 text-xs font-medium hover:bg-dark-200 transition-colors">
                        ↩️ Reembolsar
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
