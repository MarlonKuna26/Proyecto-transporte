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
    { icon: '🔍', title: 'Buscar viajes', desc: 'Encuentra viajes disponibles', path: '/rides', color: 'from-primary-500 to-primary-600' },
    { icon: '📍', title: 'Publicar viaje', desc: 'Ofrece asientos', path: '/rides?create=true', color: 'from-accent-500 to-accent-600' },
    { icon: '📋', title: 'Mis viajes', desc: 'Gestiona como conductor', path: '/my-rides', color: 'from-violet-500 to-violet-600' },
    { icon: '📨', title: 'Solicitudes', desc: 'Revisa tus solicitudes', path: '/my-requests', color: 'from-amber-500 to-amber-600' },
  ];

  const statusColor: Record<string, string> = {
    PUBLISHED: 'badge-success',
    FULL: 'badge-warning',
    IN_PROGRESS: 'badge-info',
    COMPLETED: 'badge-info',
    CANCELLED: 'badge-danger',
  };
  const statusLabel: Record<string, string> = {
    PUBLISHED: 'Disponible',
    FULL: 'Lleno',
    IN_PROGRESS: 'En curso',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="glass-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              ¡Hola, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>! 👋
            </h1>
            <p className="text-dark-400 mt-1">Bienvenido de nuevo a U-Ride</p>
          </div>
          <Link to="/rides?create=true" className="btn-primary shrink-0">
            ➕ Publicar viaje
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((a) => (
          <Link key={a.path} to={a.path} className="glass-card p-5 card-hover group">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
              {a.icon}
            </div>
            <h3 className="font-semibold text-white text-sm md:text-base">{a.title}</h3>
            <p className="text-dark-400 text-xs mt-1 hidden md:block">{a.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent rides */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Viajes recientes</h2>
          <Link to="/rides" className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
            Ver todos →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
                <div className="h-3 bg-white/10 rounded w-1/2 mb-2" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : recentRides.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-4xl mb-3">🛣️</p>
            <p className="text-dark-300">No hay viajes disponibles por ahora</p>
            <Link to="/rides?create=true" className="btn-primary inline-block mt-4">
              Publica el primero
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentRides.map((ride) => (
              <Link key={ride.id} to={`/rides?view=${ride.id}`} className="glass-card p-5 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">📍</span>
                    <span className="text-white font-medium">{ride.originZone}</span>
                    <span className="text-dark-500">→</span>
                    <span className="text-white font-medium">{ride.destinationZone}</span>
                  </div>
                  <span className={statusColor[ride.status] || 'badge-info'}>{statusLabel[ride.status]}</span>
                </div>
                <div className="flex items-center gap-4 text-dark-400 text-xs">
                  <span>📅 {ride.departureDate}</span>
                  <span>🕐 {ride.departureTime}</span>
                  <span>💺 {ride.availableSeats} asientos</span>
                </div>
                {ride.pricePerSeat > 0 && (
                  <p className="mt-2 text-accent-400 font-semibold text-sm">${ride.pricePerSeat.toLocaleString()}/persona</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
