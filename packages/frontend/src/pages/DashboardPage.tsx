import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import type { Ride } from '@/types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.rides.list({ limit: '4', status: 'PUBLISHED' });
        setRecentRides(res.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  const quickActions = [
    { icon: SearchIcon, title: 'Buscar viajes',   desc: 'Encuentra viajes disponibles', path: '/rides',           accent: '#c8a96e' },
    { icon: PinIcon,    title: 'Publicar viaje',  desc: 'Ofrece asientos',              path: '/rides?create=true',  accent: '#1a1a2e' },
    { icon: ListIcon,   title: 'Mis viajes',      desc: 'Gestiona como conductor',      path: '/my-rides',           accent: '#1a1a2e' },
    { icon: WalletIcon, title: 'Pagos',           desc: 'Gestiona tus pagos',           path: '/payments',           accent: '#c8a96e' },
  ];

  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    PUBLISHED:   { bg: '#f0faf4', color: '#2d7a4f', label: 'Disponible' },
    FULL:        { bg: '#fdf8f0', color: '#8a6a2e', label: 'Lleno'      },
    IN_PROGRESS: { bg: '#f0f4fa', color: '#2d4f7a', label: 'En curso'   },
    COMPLETED:   { bg: '#f0f4fa', color: '#2d4f7a', label: 'Completado' },
    CANCELLED:   { bg: '#fdf2f2', color: '#c0392b', label: 'Cancelado'  },
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pt-0 pb-8  space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .dash-card { background: #fff; border: 1px solid #eceae5; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .action-card { background: #fff; border: 1px solid #eceae5; border-radius: 6px; padding: 1.25rem; display: block; text-decoration: none; transition: all 0.2s ease; }
        .action-card:hover { border-color: #c8a96e; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(200,169,110,0.12); }
        .ride-card { background: #fff; border: 1px solid #eceae5; border-radius: 6px; padding: 1.25rem; display: block; text-decoration: none; transition: border-color 0.2s; }
        .ride-card:hover { border-color: #1a1a2e; }
        .pulse-line { background: #e8e4dc; border-radius: 2px; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .status-badge { font-size: 10px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; }
        .section-label { font-size: 11px; font-weight: 600; color: #a1a1a1; letter-spacing: 0.12em; text-transform: uppercase; }
      `}</style>

      {/* Header / Welcome Section */}
      <div className="dash-card overflow-hidden border-none shadow-md">
        <div className="bg-[#1a1a2e] px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1
              className="text-2xl text-white tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
            >
              Bienvenido, <span style={{ color: '#c8a96e' }}>{user?.name?.split(' ')[0] || 'Usuario'}</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-4 h-[1px] bg-[#c8a96e]"></span>
              <p className="text-[#8a8fa8] text-[10px] tracking-[0.2em] uppercase font-medium">
                Panel de Control · U-Ride
              </p>
            </div>
          </div>
          
          <Link
            to="/rides?create=true"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-[#1a1a2e] text-xs font-bold tracking-widest uppercase transition-all duration-300 hover:brightness-110 hover:scale-[1.02] shrink-0"
            style={{ 
              background: 'linear-gradient(135deg, #c8a96e 0%, #a68b56 100%)', 
              borderRadius: '4px', 
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(200, 169, 110, 0.2)'
            }}
          >
            <span style={{ fontSize: 16 }}>+</span> Publicar viaje
          </Link>
        </div>
        <div className="w-full h-[2px] bg-gradient-to-r from-[#c8a96e] to-transparent opacity-60" />
      </div>

      {/* Quick actions */}
      <div className="space-y-4">
        <p className="section-label">Acciones rápidas</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <Link key={a.path} to={a.path} className="action-card">
              <div
                className="w-10 h-10 flex items-center justify-center mb-4"
                style={{ background: a.accent === '#c8a96e' ? '#fdf8f0' : '#f0f0f5', borderRadius: '6px' }}
              >
                <a.icon color={a.accent} />
              </div>
              <h3 className="text-[#1a1a2e] text-sm font-bold">{a.title}</h3>
              <p className="text-[#999] text-[11px] mt-1 hidden md:block leading-relaxed">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent rides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="section-label">Viajes recientes</p>
          <Link
            to="/rides"
            className="text-[#c8a96e] text-[10px] font-bold tracking-widest uppercase hover:underline flex items-center gap-1"
            style={{ textDecoration: 'none' }}
          >
            Ver todos <span>→</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="dash-card p-6">
                <div className="pulse-line h-3 w-3/4 mb-3" />
                <div className="pulse-line h-2.5 w-1/2 mb-2" />
                <div className="pulse-line h-2.5 w-1/3" />
              </div>
            ))}
          </div>
        ) : recentRides.length === 0 ? (
          <div className="dash-card p-12 text-center border-dashed">
            <div
              className="inline-flex items-center justify-center w-14 h-14 bg-[#fdf8f0] mb-4"
              style={{ borderRadius: '50%' }}
            >
              <RoadIcon color="#c8a96e" />
            </div>
            <p className="text-[#999] text-sm mb-6">No hay viajes disponibles por ahora</p>
            <Link
              to="/rides?create=true"
              className="inline-block px-6 py-3 bg-[#1a1a2e] text-white text-[10px] font-bold tracking-widest uppercase hover:bg-[#2d2d4e] transition-colors"
              style={{ borderRadius: '4px', textDecoration: 'none' }}
            >
              Publica el primero
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentRides.map((ride) => {
              const s = statusStyle[ride.status] || statusStyle.IN_PROGRESS;
              return (
                <Link key={ride.id} to={`/rides?view=${ride.id}`} className="ride-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#c8a96e]" />
                      <span className="text-[#1a1a2e] font-bold text-sm">{ride.originZone}</span>
                      <span className="text-[#ccc] text-xs">→</span>
                      <span className="text-[#1a1a2e] font-bold text-sm">{ride.destinationZone}</span>
                    </div>
                    <span
                      className="status-badge"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#888] text-[11px]">
                    <span className="flex items-center gap-1">📅 {ride.departureDate}</span>
                    <span className="flex items-center gap-1">⏰ {ride.departureTime}</span>
                    <span className="flex items-center gap-1">👥 {ride.availableSeats} asientos</span>
                  </div>
                  {ride.pricePerSeat > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#f5f5f5] flex justify-between items-center">
                      <span className="text-[#999] text-[10px] uppercase tracking-wider">Costo</span>
                      <p className="text-[#c8a96e] font-bold text-base">
                        ${ride.pricePerSeat.toLocaleString()} <span className="text-[10px] font-normal text-[#999]">/ pers</span>
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Iconos SVG optimizados ── */
const SearchIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const PinIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const ListIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const WalletIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
);
const RoadIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l3-10 3 10M15 17l3-10 3 10M9 7h6"/>
  </svg>
);