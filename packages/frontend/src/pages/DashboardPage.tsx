import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import type { Ride, UserProfile } from '@/types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.rides.list({ limit: '4', status: 'PUBLISHED' });
        setRecentRides(res.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
    if (user?.id) {
      api.users.getProfile(user.id).then(res => setMyProfile(res.data)).catch();
    }
  }, [user?.id]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleCreateRide = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!myProfile || !myProfile.phone || !myProfile.emergencyContact || !myProfile.emergencyPhone) {
      setFeedback('⚠️ ¡Alto ahí! Debes completar tu perfil (teléfono, contacto de emergencia) antes de publicar un viaje.');
      return;
    }
    navigate('/rides?create=true');
  };

  const quickActions = [
    { icon: SearchIcon, title: 'Buscar viajes',   desc: 'Encuentra viajes disponibles', path: '/rides',           accent: '#c8a96e' },
    { icon: PinIcon,    title: 'Publicar viaje',  desc: 'Ofrece asientos',              action: handleCreateRide,   accent: '#1a1a2e' },
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
    <div className="max-w-6xl mx-auto px-6 pt-0 pb-8 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .r-card { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; }
        .action-card { background: #fff; border: 0.5px solid #d8d4cc; border-radius: 4px; padding: 1.25rem; display: block; text-decoration: none; transition: all 0.2s ease; cursor: pointer; text-align: left; width: 100%; }
        .action-card:hover { border-color: #1a1a2e; }
        .r-ride { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; padding:1.25rem; display: block; text-decoration: none; transition:border-color 0.2s; }
        .r-ride:hover { border-color:#1a1a2e; }
        .pulse-line { background: #e8e4dc; border-radius: 2px; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .status-badge { font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 10px; border-radius: 2px; white-space: nowrap; }
        .section-label { font-size: 11px; font-weight: 500; color: #6b6b6b; letter-spacing: 0.1em; text-transform: uppercase; }
        .r-btn-gold { background:#c8a96e; color:#1a1a2e; padding:10px 20px; font-size:12px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; border:none; cursor:pointer; border-radius:2px; transition:background 0.2s; font-family:'DM Sans',sans-serif; text-decoration: none; }
        .r-btn-gold:hover { background:#d4b87a; }
      `}</style>

      {/* Header / Welcome Section */}
      <div className="r-card overflow-hidden mb-6">
        <div className="bg-[#1a1a2e] px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1
              className="text-2xl text-white tracking-wide"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
            >
              Bienvenido, <span style={{ color: '#c8a96e' }}>{user?.name?.split(' ')[0] || 'Usuario'}</span>
            </h1>
            <p className="text-[#8a8fa8] text-xs tracking-widest uppercase mt-1">
              Panel de Control · U-Ride
            </p>
          </div>
          
          <button
            onClick={handleCreateRide}
            className="r-btn-gold shrink-0 flex items-center justify-center gap-2"
          >
            <span>+</span> Publicar viaje
          </button>
        </div>
        <div className="w-full h-px bg-[#c8a96e] opacity-40" />
      </div>

      {feedback && (
        <div
          className="flex items-center gap-3 px-4 py-3 text-sm"
          style={{ background: '#fdf2f2', borderLeft: '3px solid #c0392b', color: '#c0392b', borderRadius: '0 2px 2px 0' }}
        >
          <span>{feedback}</span>
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-4">
        <p className="section-label">Acciones rápidas</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a, i) => {
            const content = (
              <>
                <div
                  className="w-10 h-10 flex items-center justify-center mb-4"
                  style={{ background: a.accent === '#c8a96e' ? '#fdf8f0' : '#f0f0f5', borderRadius: '4px' }}
                >
                  <a.icon color={a.accent} />
                </div>
                <h3 className="text-[#1a1a2e] text-sm font-medium">{a.title}</h3>
                <p className="text-[#999] text-xs mt-1 hidden md:block">{a.desc}</p>
              </>
            );

            if (a.action) {
              return (
                <button key={i} onClick={a.action} className="action-card">
                  {content}
                </button>
              );
            }
            return (
              <Link key={i} to={a.path!} className="action-card">
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent rides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="section-label">Viajes recientes</p>
          <Link
            to="/rides"
            className="text-[#c8a96e] text-[11px] font-medium tracking-widest uppercase hover:underline flex items-center gap-1"
            style={{ textDecoration: 'none' }}
          >
            Ver todos <span>→</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="r-card p-6">
                <div className="pulse-line h-3 w-3/4 mb-3" />
                <div className="pulse-line h-2.5 w-1/2 mb-2" />
                <div className="pulse-line h-2.5 w-1/3" />
              </div>
            ))}
          </div>
        ) : recentRides.length === 0 ? (
          <div className="r-card p-12 text-center border-dashed">
            <div
              className="inline-flex items-center justify-center w-12 h-12 bg-[#fdf8f0] mb-4"
              style={{ borderRadius: '4px' }}
            >
              <RoadIcon color="#c8a96e" />
            </div>
            <p className="text-[#999] text-sm mb-6">No hay viajes disponibles por ahora</p>
            <button
              onClick={handleCreateRide}
              className="r-btn-gold"
            >
              Publica el primero
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentRides.map((ride) => {
              const s = statusStyle[ride.status] || statusStyle.IN_PROGRESS;
              return (
                <Link key={ride.id} to={`/rides?view=${ride.id}`} className="r-ride">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 text-[#1a1a2e] font-medium text-sm">
                        <span style={{ color: '#c8a96e', fontSize: 12 }}>●</span>
                        {ride.originZone}
                        <span className="text-[#ccc] text-xs">→</span>
                        {ride.destinationZone}
                      </div>
                      {ride.originDetail && (
                        <p className="text-[#bbb] text-xs mt-0.5 ml-4">{ride.originDetail}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <span className="status-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#999] text-xs mb-3">
                    <span>{ride.departureDate}</span>
                    <span>{ride.departureTime}</span>
                    <span>{ride.availableSeats} asientos</span>
                  </div>
                  
                  {ride.pricePerSeat > 0 && (
                    <div className="pt-3 border-t border-[#f5f5f5] flex justify-between items-center mt-auto">
                      <span className="text-[#bbb] text-xs uppercase tracking-widest">Costo</span>
                      <p className="text-[#c8a96e] font-medium text-sm">
                        ${ride.pricePerSeat.toLocaleString()} <span className="text-xs font-normal text-[#999]">/ pers</span>
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