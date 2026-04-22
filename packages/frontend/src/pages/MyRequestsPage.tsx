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

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    PENDING:   { label: 'Pendiente',  bg: '#fdf8f0', color: '#8a6a2e' },
    ACCEPTED:  { label: 'Aceptada',   bg: '#f0faf4', color: '#2d7a4f' },
    REJECTED:  { label: 'Rechazada',  bg: '#fdf2f2', color: '#c0392b' },
    CANCELLED: { label: 'Cancelada',  bg: '#fdf2f2', color: '#c0392b' },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .mr-card { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; }
        .mr-item { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; padding:1.25rem; transition:border-color 0.2s; }
        .mr-item:hover { border-color:#1a1a2e; }
        .status-badge { font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; padding:3px 10px; border-radius:2px; }
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
            return (
              <div key={req.id} className="mr-item flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  {/* Top row */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="text-[#999] text-xs">
                      {req.seatsRequested} asiento{req.seatsRequested !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {req.message && (
                    <p className="text-[#666] text-sm mb-1">{req.message}</p>
                  )}

                  <p className="text-[#bbb] text-xs">
                    {new Date(req.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {req.status === 'PENDING' && (
                  <button
                    onClick={() => cancelRequest(req.id)}
                    className="shrink-0 px-4 py-2 text-xs font-medium tracking-widest uppercase transition-colors duration-200"
                    style={{
                      background: '#fdf2f2',
                      color: '#c0392b',
                      border: '0.5px solid #f0b8b8',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
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

/* ── Inline SVG icon ── */
const InboxIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
);