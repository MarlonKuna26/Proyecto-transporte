import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { RideRequest } from '@/types';

export const MyRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.rideRequests.myRequests();
        setRequests(res.data || []);
      } catch { }
      setLoading(false);
    };
    load();
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

  const statusConfig: Record<string, { label: string; class: string; icon: string }> = {
    PENDING: { label: 'Pendiente', class: 'badge-warning', icon: '⏳' },
    ACCEPTED: { label: 'Aceptada', class: 'badge-success', icon: '✅' },
    REJECTED: { label: 'Rechazada', class: 'badge-danger', icon: '❌' },
    CANCELLED: { label: 'Cancelada', class: 'badge-danger', icon: '🚫' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">📨 Mis solicitudes de viaje</h1>

      {feedback && <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm">✅ {feedback}</div>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="glass-card p-5 animate-pulse"><div className="h-4 bg-white/10 rounded w-2/3" /></div>)}</div>
      ) : requests.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-5xl mb-4">📨</p>
          <p className="text-dark-300 text-lg">No tienes solicitudes aún</p>
          <p className="text-dark-400 text-sm mt-2">Busca viajes y solicita unirte</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const cfg = statusConfig[req.status] || statusConfig.PENDING;
            return (
              <div key={req.id} className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{cfg.icon}</span>
                    <span className={cfg.class}>{cfg.label}</span>
                    <span className="text-dark-400 text-xs">{req.seatsRequested} asiento(s)</span>
                  </div>
                  {req.message && <p className="text-dark-400 text-sm ml-8">💬 {req.message}</p>}
                  <p className="text-dark-500 text-xs ml-8 mt-1">
                    {new Date(req.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {req.status === 'PENDING' && (
                  <button onClick={() => cancelRequest(req.id)} className="btn-danger text-sm px-4 py-2">
                    Cancelar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
