import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import type { Ride, UserProfile } from '@/types';
import { ToastContainer, type ToastMessage } from '@/components/Toast';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [hasVehicles, setHasVehicles] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  // ===== TOAST FUNCTIONS =====
  const addToast = (msg: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { id, msg, type, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

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
      api.users.getVehicles().then(res => setHasVehicles(res.data && res.data.length > 0)).catch();
    }
  }, [user?.id]);

  const handleCreateRide = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!myProfile || !myProfile.phone || !myProfile.emergencyContact || !myProfile.emergencyPhone) {
      addToast('¡Alto ahí! Debes completar tu perfil (teléfono, contacto de emergencia) antes de publicar un viaje.', 'error');
      return;
    }
    if (!hasVehicles) {
      addToast('Debes registrar un vehículo en tu perfil antes de publicar un viaje.', 'error');
      return;
    }
    navigate('/rides?create=true');
  };

  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    PUBLISHED:   { bg: '#E6F4EA', color: '#06C167', label: 'Disponible' },
    FULL:        { bg: '#FFF3E0', color: '#FF6937', label: 'Lleno' },
    IN_PROGRESS: { bg: '#E8F0FE', color: '#276EF1', label: 'En curso' },
    COMPLETED:   { bg: '#F6F6F6', color: '#545454', label: 'Completado' },
    CANCELLED:   { bg: '#FDECEA', color: '#E11900', label: 'Cancelado' },
  };

  return (
    <div className="max-w-7xl mx-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      <ToastContainer messages={messages} onClose={removeToast} />

      {/* ═══ HERO SECTION — "Consigue un viaje" (Uber Main UI) ═══ */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Left: Trip Search Card */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
              <h1 className="text-2xl font-bold text-black mb-6">
                Hola, {user?.name?.split(' ')[0] || 'Usuario'}
              </h1>

              {/* Search inputs (Uber style) */}
              <div className="space-y-2 mb-4">
                {/* Origin */}
                <div
                  className="flex items-center gap-3 px-4 py-3.5 bg-uber-gray-50 rounded-lg cursor-pointer hover:bg-uber-gray-100 transition-colors"
                  onClick={() => navigate('/rides')}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-black shrink-0" />
                  <span className="text-sm text-uber-gray-500">¿Desde dónde sales?</span>
                </div>

                {/* Destination */}
                <div
                  className="flex items-center gap-3 px-4 py-3.5 bg-uber-gray-50 rounded-lg cursor-pointer hover:bg-uber-gray-100 transition-colors"
                  onClick={() => navigate('/rides')}
                >
                  <div className="w-2.5 h-2.5 bg-black shrink-0" style={{ borderRadius: '2px' }} />
                  <span className="text-sm text-uber-gray-500 flex-1">¿A dónde vas?</span>
                  <div className="w-7 h-7 rounded-full bg-uber-gray-200 flex items-center justify-center hover:bg-uber-gray-300 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#545454" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </div>
                </div>
              </div>

              {/* Schedule / Options row */}
              <div className="flex items-center gap-3 mb-5">
                <button
                  className="flex items-center gap-2 px-3 py-2 bg-uber-gray-50 rounded-full text-xs font-medium text-uber-gray-700 hover:bg-uber-gray-100 transition-colors"
                  style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Salir ahora
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 bg-uber-gray-50 rounded-full text-xs font-medium text-uber-gray-700 hover:bg-uber-gray-100 transition-colors"
                  style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Para mí
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>

              {/* Search button */}
              <button
                onClick={() => navigate('/rides')}
                className="uber-btn-primary w-full py-3.5 text-base font-semibold"
              >
                Buscar viajes
              </button>
            </div>
          </div>

          {/* Right: Visual area (map-like placeholder) */}
          <div className="flex-1 min-h-[260px] lg:min-h-[360px] rounded-2xl overflow-hidden relative" style={{ background: '#F6F6F6' }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, #E8F0FE 0%, #F6F6F6 30%, #E6F4EA 60%, #F6F6F6 100%)',
            }}>
              {/* Decorative road lines */}
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 300">
                <path d="M0 150 Q100 100 200 150 T400 150" fill="none" stroke="#000" strokeWidth="3" strokeDasharray="8 6"/>
                <path d="M50 50 Q150 200 250 100 T400 200" fill="none" stroke="#000" strokeWidth="2" strokeDasharray="5 5"/>
                <circle cx="200" cy="150" r="6" fill="#000" opacity="0.3"/>
                <circle cx="100" cy="120" r="4" fill="#06C167" opacity="0.5"/>
                <circle cx="300" cy="130" r="4" fill="#276EF1" opacity="0.5"/>
              </svg>

              {/* Floating card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl px-5 py-3 shadow-uber-md flex items-center gap-3 animate-fade-in">
                <div className="w-2 h-2 rounded-full bg-black" />
                <span className="text-sm font-medium text-black">U-Ride · Transporte Estudiantil</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AFAFAF" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ QUICK ACTIONS — "Sugerencias" (Uber style circular icons) ═══ */}
      <div className="px-4 md:px-8 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-black">Sugerencias</h2>
          <Link
            to="/rides"
            className="text-sm font-medium text-uber-gray-600 hover:text-black transition-colors"
            style={{ textDecoration: 'none' }}
          >
            Ver todo
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {/* Buscar viajes */}
          <Link to="/rides" className="flex flex-col items-center gap-2 min-w-[80px] group" style={{ textDecoration: 'none' }}>
            <div className="w-16 h-16 rounded-2xl bg-uber-gray-50 flex items-center justify-center group-hover:bg-uber-gray-100 transition-colors">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <span className="text-xs font-medium text-uber-gray-700 text-center">Buscar</span>
          </Link>

          {/* Publicar viaje */}
          <button onClick={handleCreateRide} className="flex flex-col items-center gap-2 min-w-[80px] group" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div className="w-16 h-16 rounded-2xl bg-uber-gray-50 flex items-center justify-center group-hover:bg-uber-gray-100 transition-colors relative">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <div className="absolute -top-1 -right-1 bg-uber-green text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Nuevo</div>
            </div>
            <span className="text-xs font-medium text-uber-gray-700 text-center">Publicar</span>
          </button>

          {/* Mis viajes */}
          <Link to="/my-rides" className="flex flex-col items-center gap-2 min-w-[80px] group" style={{ textDecoration: 'none' }}>
            <div className="w-16 h-16 rounded-2xl bg-uber-gray-50 flex items-center justify-center group-hover:bg-uber-gray-100 transition-colors">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/><circle cx="6.5" cy="15.5" r="1.5"/><circle cx="17.5" cy="15.5" r="1.5"/></svg>
            </div>
            <span className="text-xs font-medium text-uber-gray-700 text-center">Mis viajes</span>
          </Link>

          {/* Pagos */}
          <Link to="/payments" className="flex flex-col items-center gap-2 min-w-[80px] group" style={{ textDecoration: 'none' }}>
            <div className="w-16 h-16 rounded-2xl bg-uber-gray-50 flex items-center justify-center group-hover:bg-uber-gray-100 transition-colors">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <span className="text-xs font-medium text-uber-gray-700 text-center">Pagos</span>
          </Link>

          {/* Solicitudes */}
          <Link to="/my-requests" className="flex flex-col items-center gap-2 min-w-[80px] group" style={{ textDecoration: 'none' }}>
            <div className="w-16 h-16 rounded-2xl bg-uber-gray-50 flex items-center justify-center group-hover:bg-uber-gray-100 transition-colors">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
            </div>
            <span className="text-xs font-medium text-uber-gray-700 text-center">Solicitudes</span>
          </Link>

          {/* Perfil */}
          <Link to="/profile" className="flex flex-col items-center gap-2 min-w-[80px] group" style={{ textDecoration: 'none' }}>
            <div className="w-16 h-16 rounded-2xl bg-uber-gray-50 flex items-center justify-center group-hover:bg-uber-gray-100 transition-colors">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span className="text-xs font-medium text-uber-gray-700 text-center">Perfil</span>
          </Link>
        </div>
      </div>

      {/* ═══ RECENT RIDES SECTION ═══ */}
      <div className="px-4 md:px-8 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-black">Viajes recientes</h2>
          <Link
            to="/rides"
            className="text-sm font-medium text-uber-gray-600 hover:text-black transition-colors flex items-center gap-1"
            style={{ textDecoration: 'none' }}
          >
            Ver todos
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>

        {loading ? (
          /* Skeleton loader (Uber style) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-uber-gray-100" />
                  <div className="flex-1">
                    <div className="h-3 bg-uber-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-2.5 bg-uber-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-2.5 bg-uber-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : recentRides.length === 0 ? (
          /* Empty state (Uber style) */
          <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-uber-gray-50 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#AFAFAF" strokeWidth="1.5">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/>
                <circle cx="6.5" cy="15.5" r="1.5"/><circle cx="17.5" cy="15.5" r="1.5"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Aún no has hecho ningún viaje</h3>
            <p className="text-sm text-uber-gray-500 mb-6 max-w-sm mx-auto">
              Haz el primero buscando viajes disponibles o publicando el tuyo
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/rides"
                className="uber-btn-primary inline-flex items-center justify-center gap-2"
                style={{ textDecoration: 'none' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Buscar viajes
              </Link>
              <button
                onClick={handleCreateRide}
                className="uber-btn-secondary inline-flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Publicar viaje
              </button>
            </div>
          </div>
        ) : (
          /* Ride cards (Uber style) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentRides.map((ride) => {
              const s = statusConfig[ride.status] || statusConfig.IN_PROGRESS;
              return (
                <Link
                  key={ride.id}
                  to={`/rides?view=${ride.id}`}
                  className="block bg-white rounded-2xl p-5 transition-all duration-200 hover:shadow-uber-md group relative"
                  style={{ textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Route indicator (Uber dots) */}
                      <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-black" />
                        <div className="w-0.5 h-6 bg-uber-gray-200" />
                        <div className="w-2.5 h-2.5 bg-black" style={{ borderRadius: '2px' }} />
                      </div>
                      {/* Route info */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-black truncate">{ride.originZone}</p>
                        {ride.originDetail && (
                          <p className="text-xs text-uber-gray-400 truncate mt-0.5">{ride.originDetail}</p>
                        )}
                        <p className="text-sm font-semibold text-black truncate mt-3">{ride.destinationZone}</p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ml-2"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </div>

                  {/* Ride details */}
                  <div className="flex items-center gap-3 text-xs text-uber-gray-500 pl-6">
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {ride.departureDate} · {ride.departureTime}
                    </span>
                    <span>·</span>
                    <span>{ride.availableSeats} asientos</span>
                  </div>

                  {/* Price */}
                  {ride.pricePerSeat > 0 && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-uber-gray-100 pl-6">
                      <span className="text-xs text-uber-gray-400">Precio por persona</span>
                      <span className="text-base font-bold text-black">
                        ${ride.pricePerSeat.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Hover arrow */}
                  <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AFAFAF" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};