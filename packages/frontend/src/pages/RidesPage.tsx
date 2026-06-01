import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { LiveMap } from '@/components/LiveMap';
import { ToastContainer, type ToastMessage } from '@/components/Toast';
import type { Ride, RideRequest, UserProfile } from '@/types';
import { ZONAS_AMBATO, CAMPUS_UTA, ZONE_COORDINATES } from '@/constants';

export const RidesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewRide, setViewRide] = useState<Ride | null>(null);

  const [requestMsg, setRequestMsg] = useState('');
  const [filters, setFilters] = useState({ originZone: '', destinationZone: '', departureDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const [acceptedUsers, setAcceptedUsers] = useState<UserProfile[]>([]);
  const [loadingAccepted, setLoadingAccepted] = useState(false);
  const [driverProfile, setDriverProfile] = useState<UserProfile | null>(null);
  const [loadingDriver, setLoadingDriver] = useState(false);

  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'paypal'>('efectivo');
  const [transferRef, setTransferRef] = useState('');

  const [myProfile, setMyProfile] = useState<UserProfile | null>(null);
  const [myRequests, setMyRequests] = useState<RideRequest[]>([]);

  /* ===== LOAD ===== */
  const addToast = (msg: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { id, msg, type, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const loadRides = async () => {
    setLoading(true);
    try {
      const res = await api.rides.list({ status: 'PUBLISHED' });
      setRides(res.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    loadRides();
    if (user?.id) {
      api.users.getProfile(user.id).then(res => setMyProfile(res.data)).catch();
      api.rideRequests.myRequests().then(res => setMyRequests(res.data || [])).catch();
    }
  }, [user?.id]);

  useEffect(() => {
    setShowPaymentStep(false);
    setPaymentMethod('efectivo');
    setTransferRef('');

    const fetchAccepted = async () => {
      if (!viewRide) {
        setAcceptedUsers([]);
        setDriverProfile(null);
        return;
      }
      setLoadingDriver(true);
      setLoadingAccepted(true);

      // Cargar pasajeros aceptados (endpoint público)
      try {
        const res = await api.rideRequests.passengers(viewRide.id);
        const accepted: RideRequest[] = res.data || [];
        const profiles: UserProfile[] = [];
        for (const req of accepted) {
          try {
            const userRes = await api.users.getProfile(req.passengerId);
            if (userRes.data) profiles.push(userRes.data);
          } catch {}
        }
        setAcceptedUsers(profiles);
      } catch {
        setAcceptedUsers([]);
      }
      setLoadingAccepted(false);

      // Cargar perfil del conductor
      try {
        const resDriver = await api.users.getProfile(viewRide.driverId);
        if (resDriver?.data) setDriverProfile(resDriver.data);
      } catch {
        setDriverProfile(null);
      }
      setLoadingDriver(false);
    };
    fetchAccepted();
  }, [viewRide]);

  const handleRequestJoin = async (rideId: string) => {
    if (!myProfile || !myProfile.career || !myProfile.phone) {
      addToast('Por favor, actualiza tu perfil (carrera y teléfono) en la sección de Perfil antes de solicitar unirte a un viaje.', 'error');
      return;
    }

    try {
      let finalMsg = requestMsg;
      if (paymentMethod === 'efectivo') {
        finalMsg = `${requestMsg} [Pago: Efectivo]`.trim();
      } else if (paymentMethod === 'transferencia') {
        const ref = transferRef.trim() || '-';
        finalMsg = `${requestMsg} [Pago: Transferencia, Ref: ${ref}]`.trim();
      } else if (paymentMethod === 'paypal') {
        finalMsg = `${requestMsg} [Pago: PayPal]`.trim();
      }

      await api.rideRequests.create({ rideId, message: finalMsg || null, seatsRequested: 1 });
      addToast('¡Solicitud enviada con éxito!', 'success');

      if (user?.id) {
        api.rideRequests.myRequests().then(res => setMyRequests(res.data || [])).catch();
      }

      setViewRide(null);
      setRequestMsg('');
      setShowPaymentStep(false);
      setTransferRef('');
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('already have a pending or accepted')) {
        addToast('Ya tienes una solicitud pendiente o aceptada para este viaje.', 'error');
      } else {
        addToast(err.message || 'Error al solicitar viaje.', 'error');
      }
    }
  };

  const handleViewRide = async (ride: Ride) => {
    setViewRide(ride);
    try {
      const res = await api.rides.getById(ride.id);
      if (res.data) {
        setViewRide(res.data);
        setRides(prev => prev.map(r => r.id === ride.id ? res.data : r));
      }
    } catch {}
    if (user?.id) {
      try {
        const reqRes = await api.rideRequests.myRequests();
        setMyRequests(reqRes.data || []);
      } catch {}
    }
  };

  const statusStyleMap: Record<string, { border: string; text: string; bg: string; label: string }> = {
    PUBLISHED:   { border: 'border-emerald-500', text: 'text-black', bg: 'bg-white', label: 'Disponible' },
    FULL:        { border: 'border-amber-500',   text: 'text-black', bg: 'bg-white', label: 'Lleno' },
    IN_PROGRESS: { border: 'border-blue-500',    text: 'text-black', bg: 'bg-white', label: 'En curso' },
    COMPLETED:   { border: 'border-zinc-300',    text: 'text-black', bg: 'bg-white', label: 'Completado' },
    CANCELLED:   { border: 'border-red-500',     text: 'text-black', bg: 'bg-white', label: 'Cancelado' },
  };

  const today = new Date().toISOString().split('T')[0];

  // Frontend filtration based on filters state
  const filteredRides = rides.filter(ride => {
    if (user && ride.driverId === user.id) return false;
    if (filters.originZone && ride.originZone !== filters.originZone) return false;
    if (filters.destinationZone && ride.destinationZone !== filters.destinationZone) return false;
    if (filters.departureDate && ride.departureDate !== filters.departureDate) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredRides.length / pageSize);
  const paginatedRides = filteredRides.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ═══ HEADER SECTION ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-uber-gray-100">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
            Viajes disponibles
          </h1>
          <p className="text-sm text-uber-gray-500 mt-1">
            Encuentra o publica rutas estudiantiles para tu campus
          </p>
        </div>

        <button
          onClick={() => navigate('/my-rides?create=true')}
          className="uber-btn-primary self-start sm:self-center inline-flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo viaje
        </button>
      </div>

      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      <ToastContainer messages={messages} onClose={removeToast} />

      {/* ═══ SEARCH & FILTERS BAR (Uber aesthetic) ═══ */}
      <div className="bg-uber-gray-50 rounded-2xl p-5 border border-uber-gray-100 flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {/* Origin Zone Filter */}
          <div className="flex-1 relative">
            <label className="block text-[10px] font-bold text-uber-gray-500 uppercase tracking-wider mb-1.5 pl-1">Origen</label>
            <div className="relative">
              <select
                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-uber-gray-200 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black appearance-none"
                value={filters.originZone}
                onChange={e => {
                  setFilters(prev => ({ ...prev, originZone: e.target.value }));
                  setCurrentPage(1);
                }}
              >
                <option value="">Todas las zonas</option>
                <optgroup label="Campus UTA">
                  {CAMPUS_UTA.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
                <optgroup label="Zonas Ambato">
                  {ZONAS_AMBATO.map(z => <option key={z} value={z}>{z}</option>)}
                </optgroup>
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-black pointer-events-none" />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-uber-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>

          {/* Destination Zone Filter */}
          <div className="flex-1 relative">
            <label className="block text-[10px] font-bold text-uber-gray-500 uppercase tracking-wider mb-1.5 pl-1">Destino</label>
            <div className="relative">
              <select
                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-uber-gray-200 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black appearance-none"
                value={filters.destinationZone}
                onChange={e => {
                  setFilters(prev => ({ ...prev, destinationZone: e.target.value }));
                  setCurrentPage(1);
                }}
              >
                <option value="">Todas las zonas</option>
                <optgroup label="Campus UTA">
                  {CAMPUS_UTA.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
                <optgroup label="Zonas Ambato">
                  {ZONAS_AMBATO.map(z => <option key={z} value={z}>{z}</option>)}
                </optgroup>
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-black pointer-events-none" style={{ borderRadius: '2px' }} />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-uber-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="w-full md:w-48 relative">
            <label className="block text-[10px] font-bold text-uber-gray-500 uppercase tracking-wider mb-1.5 pl-1">Fecha</label>
            <input
              type="date"
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-uber-gray-200 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
              value={filters.departureDate}
              onChange={e => {
                setFilters(prev => ({ ...prev, departureDate: e.target.value }));
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Clear Filters Button */}
          {(filters.originZone || filters.destinationZone || filters.departureDate) && (
            <button
              onClick={() => setFilters({ originZone: '', destinationZone: '', departureDate: '' })}
              className="self-end md:self-center px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-xl transition-all shrink-0"
              style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
            >
              Limpiar filtros
            </button>
          )}
        </div>



      {/* ═══ RIDES LIST SECTION ═══ */}
      {loading ? (
        /* Uber Skeleton loaders */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-uber-gray-100 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-uber-gray-100" />
                <div className="flex-1">
                  <div className="h-3.5 bg-uber-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-uber-gray-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-uber-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredRides.length === 0 ? (
        /* Styled Empty state */
        <div className="bg-white rounded-3xl p-12 text-center border border-uber-gray-100 shadow-uber-sm max-w-xl mx-auto my-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-uber-gray-50 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBCBCB" strokeWidth="1.5">
              <path d="M3 17l3-10 3 10M15 17l3-10 3 10M9 7h6"/>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-black mb-2">No se encontraron viajes</h3>
          <p className="text-sm text-uber-gray-500 mb-6 max-w-sm mx-auto">
            {filters.originZone || filters.destinationZone || filters.departureDate
              ? 'Prueba modificando tus filtros o eliminándolos para buscar otras opciones.'
              : 'Actualmente no hay viajes publicados en esta sección. ¡Sé el primero en publicar uno!'}
          </p>
          {filters.originZone || filters.destinationZone || filters.departureDate ? (
            <button
              onClick={() => setFilters({ originZone: '', destinationZone: '', departureDate: '' })}
              className="uber-btn-secondary inline-flex items-center gap-2"
            >
              Quitar filtros
            </button>
          ) : (
            <button
              onClick={() => navigate('/my-rides?create=true')}
              className="uber-btn-primary inline-flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Publicar el primero
            </button>
          )}
        </div>
      ) : (
        /* Ride cards grid */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedRides.map(ride => {
              const s = statusStyleMap[ride.status] || statusStyleMap.IN_PROGRESS;
              return (
                <div
                  key={ride.id}
                  onClick={() => handleViewRide(ride)}
                  className="bg-white rounded-2xl p-6 border border-uber-gray-100 shadow-uber-sm hover:shadow-uber-md transition-all duration-200 cursor-pointer flex flex-col group relative animate-fade-in"
                >
                  {/* Top line: Route with dot indicators */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex gap-3 min-w-0">
                      <div className="flex flex-col items-center gap-1.5 mt-1 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-black" />
                        <div className="w-0.5 h-7 bg-uber-gray-200" />
                        <div className="w-2.5 h-2.5 bg-black" style={{ borderRadius: '2px' }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-black truncate">{ride.originZone}</h3>
                        {ride.originDetail && (
                          <p className="text-xs text-uber-gray-400 truncate mt-0.5">{ride.originDetail}</p>
                        )}
                        <h3 className="text-sm font-semibold text-black truncate mt-3.5">{ride.destinationZone}</h3>
                        {ride.destinationDetail && (
                          <p className="text-xs text-uber-gray-400 truncate mt-0.5">{ride.destinationDetail}</p>
                        )}
                      </div>
                    </div>

                    {/* Top-right Actions & Badges */}
                    <div className="flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap border shadow-sm ${s.bg} ${s.border} ${s.text}`}
                      >
                        {s.label}
                      </span>

                      {/* Driver options if owner was here, now removed */}
                    </div>
                  </div>

                  {/* Bottom line: details + price */}
                  <div className="mt-auto pt-4 border-t border-uber-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-uber-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {ride.departureDate} · {ride.departureTime}
                      </span>
                      <span>·</span>
                      <span>{ride.availableSeats} asientos</span>
                    </div>

                    {ride.pricePerSeat > 0 ? (
                      <div className="text-right">
                        <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider">Por persona</span>
                        <span className="text-base font-bold text-black">${ride.pricePerSeat.toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-black bg-white px-2 py-0.5 rounded border border-emerald-500 font-black">Gratis</span>
                    )}
                  </div>

                  {/* Hover arrow indicator */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
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

      {/* ═══ VIEW RIDE MODAL ═══ */}
      {/* ═══ VIEW RIDE MODAL ═══ */}
      {viewRide && (() => {
        const originLat = viewRide.originLat ?? ZONE_COORDINATES[viewRide.originZone]?.lat;
        const originLng = viewRide.originLng ?? ZONE_COORDINATES[viewRide.originZone]?.lng;
        const destLat = viewRide.destinationLat ?? ZONE_COORDINATES[viewRide.destinationZone]?.lat;
        const destLng = viewRide.destinationLng ?? ZONE_COORDINATES[viewRide.destinationZone]?.lng;

        const mapOrigin = originLat && originLng ? { lat: originLat, lng: originLng, label: viewRide.originZone } : null;
        const mapDest = destLat && destLng ? { lat: destLat, lng: destLng, label: viewRide.destinationZone } : null;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setViewRide(null)}
          >
            <div
              className="w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-uber-lg animate-slide-up-mobile max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="bg-black text-white px-6 py-5 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold">Detalle del viaje</h2>
                  <p className="text-xs text-uber-gray-400 mt-0.5">Ruta de transporte universitario</p>
                </div>
                <button
                  onClick={() => setViewRide(null)}
                  className="text-uber-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1.5 rounded-full hover:bg-white/10 text-xl font-medium"
                >✕</button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Driver Info Card */}
                <div className="bg-uber-gray-50 rounded-2xl p-4 border border-uber-gray-100 shadow-uber-sm flex items-center justify-between gap-4">
                  {loadingDriver ? (
                    <div className="flex items-center gap-3 w-full animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-uber-gray-200 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-uber-gray-200 rounded w-1/3" />
                        <div className="h-2.5 bg-uber-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ) : driverProfile ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Driver photo */}
                        {driverProfile.photoUrl ? (
                          <img
                            src={driverProfile.photoUrl}
                            alt={driverProfile.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-base border-2 border-white shadow-sm shrink-0">
                            {driverProfile.name?.[0].toUpperCase() || '?'}
                          </div>
                        )}

                        {/* Driver details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-extrabold text-black truncate">{driverProfile.name}</span>
                            {driverProfile.isVerified && (
                              <span className="text-black inline-flex shrink-0" title="Perfil verificado">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-uber-gray-500 truncate mt-0.5">
                            {driverProfile.career || 'Conductor Universitario'}
                          </p>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-black font-bold bg-white border border-amber-500 rounded-md px-1.5 py-0.5 w-fit">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            <span>{(() => {
                              const val = parseFloat(driverProfile.reputation as any);
                              return isNaN(val) ? '5.0' : val.toFixed(1);
                            })()}</span>
                            <span className="text-uber-gray-400 font-normal">({driverProfile.totalRatings || 0} calif.)</span>
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp / Phone Action buttons */}
                      {driverProfile.phone && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${driverProfile.phone}`}
                            className="w-9 h-9 rounded-full bg-white border border-uber-gray-200 flex items-center justify-center text-uber-gray-700 hover:bg-uber-gray-100 transition-colors shadow-sm"
                            title="Llamar al conductor"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          </a>
                          <a
                            href={`https://wa.me/${driverProfile.phone.startsWith('+') ? driverProfile.phone.replace('+', '') : (driverProfile.phone.startsWith('09') ? '593' + driverProfile.phone.substring(1) : driverProfile.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-white border border-uber-gray-100 flex items-center justify-center text-black hover:bg-uber-gray-50 transition-colors shadow-sm"
                            title="Enviar WhatsApp"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-uber-gray-400 font-medium py-1">Información de conductor no disponible</div>
                  )}
                </div>

                {/* Route segment */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1.5 mt-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-black animate-pulse" />
                    <div className="w-0.5 h-12 bg-uber-gray-200" />
                    <div className="w-2.5 h-2.5 bg-black" style={{ borderRadius: '2px' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-uber-gray-400 font-bold uppercase tracking-wider">Origen</span>
                    <h4 className="text-sm font-bold text-black leading-tight">{viewRide.originZone}</h4>
                    {viewRide.originDetail && (
                      <p className="text-xs text-uber-gray-500 mt-0.5">{viewRide.originDetail}</p>
                    )}

                    <div className="h-4" />

                    <span className="text-[10px] text-uber-gray-400 font-bold uppercase tracking-wider">Destino</span>
                    <h4 className="text-sm font-bold text-black leading-tight">{viewRide.destinationZone}</h4>
                    {viewRide.destinationDetail && (
                      <p className="text-xs text-uber-gray-500 mt-0.5">{viewRide.destinationDetail}</p>
                    )}
                  </div>
                </div>

                {/* Ride details parameters */}
                <div className="grid grid-cols-3 gap-4 py-3.5 border-t border-b border-uber-gray-100 text-center">
                  <div>
                    <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider mb-1">Salida</span>
                    <span className="text-xs font-extrabold text-black block">{viewRide.departureDate}</span>
                    <span className="text-[10px] text-uber-gray-500 font-medium block mt-0.5">{viewRide.departureTime}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider mb-1">Capacidad</span>
                    <span className="text-xs font-extrabold text-black block">{viewRide.availableSeats} asientos</span>
                    <span className="text-[10px] text-uber-gray-500 font-medium block mt-0.5">Disponibles</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider mb-1">Costo</span>
                    <span className="text-xs font-extrabold text-black block">
                      {viewRide.pricePerSeat > 0 ? `$${viewRide.pricePerSeat.toLocaleString()}` : 'Gratis'}
                    </span>
                    <span className="text-[10px] text-uber-gray-500 font-medium block mt-0.5">Por pasajero</span>
                  </div>
                </div>

                {/* Note / rules row */}
                {(viewRide.notes || viewRide.rules) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewRide.notes && (
                      <div className="p-3.5 bg-uber-gray-50 rounded-2xl border border-uber-gray-100 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-uber-gray-100 flex items-center justify-center shrink-0 text-uber-gray-700 border border-uber-gray-200/50">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider">Notas del viaje</span>
                          <p className="text-xs text-uber-gray-700 font-semibold mt-1 leading-relaxed">{viewRide.notes}</p>
                        </div>
                      </div>
                    )}

                    {viewRide.rules && (
                      <div className="p-3.5 bg-uber-gray-50 rounded-2xl border border-uber-gray-100 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 text-uber-red border border-red-100/50">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-uber-gray-400 block font-bold uppercase tracking-wider">Reglas</span>
                          <p className="text-xs text-uber-gray-700 font-semibold mt-1 leading-relaxed">{viewRide.rules}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Map visualization */}
                {mapOrigin && (
                  <div className="rounded-2xl overflow-hidden border border-uber-gray-200 shadow-uber-sm relative">
                    <div className="absolute top-3 left-3 z-10 bg-black/85 text-white text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-sm">
                      Ruta del viaje en mapa
                    </div>
                    <LiveMap
                      origin={mapOrigin}
                      destination={mapDest}
                      height="200px"
                    />
                  </div>
                )}

                {/* Passenger list */}
                <div className="space-y-3 pt-1">
                  <span className="block text-[10px] font-bold text-uber-gray-400 tracking-wider uppercase">
                    Pasajeros aceptados
                  </span>
                  {loadingAccepted ? (
                    <div className="h-8 bg-uber-gray-50 rounded-xl animate-pulse w-full" />
                  ) : acceptedUsers.length === 0 ? (
                    <p className="text-xs text-uber-gray-400 pl-1 font-medium italic">Ningún pasajero aceptado aún</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {acceptedUsers.map(u => (
                        <div key={u.userId} className="flex items-center gap-3 px-3 py-2 bg-uber-gray-50 rounded-xl border border-uber-gray-100/60 hover:bg-uber-gray-100 transition-colors">
                          {u.photoUrl ? (
                            <img
                              src={u.photoUrl}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-white shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {u.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-black truncate leading-tight">{u.name}</p>
                            {u.career && <p className="text-[9px] text-uber-gray-400 truncate mt-0.5 leading-none">{u.career}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal footer (Actions) */}
              <div className="p-6 border-t border-uber-gray-100 bg-uber-gray-50 shrink-0">
                {/* Solicitar unirme form */}
                {viewRide.driverId !== user?.id && viewRide.status === 'PUBLISHED' ? (
                  (() => {
                    const acceptedRequest = myRequests.find(r => r.rideId === viewRide.id && r.status === 'ACCEPTED');
                    const pendingRequest = myRequests.find(r => r.rideId === viewRide.id && r.status === 'PENDING');
                    if (acceptedRequest) {
                      return (
                        <div className="text-center p-3.5 bg-white border border-emerald-500 text-black text-xs font-black rounded-xl uppercase tracking-wider shadow-xs flex items-center justify-center gap-2">
                          <span className="text-sm">✓</span> Ya está aceptado
                        </div>
                      );
                    }
                    if (pendingRequest) {
                      return (
                        <div className="text-center p-3.5 bg-white border border-emerald-500 text-black text-xs font-black rounded-xl uppercase tracking-wider shadow-xs">
                          Ya has enviado una solicitud para este viaje
                        </div>
                      );
                    }
                    if (showPaymentStep) {
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-uber-gray-500 uppercase tracking-wider">
                              Método de Pago
                            </span>
                            <span className="text-xs font-bold text-black bg-uber-gray-100 px-2 py-0.5 rounded">
                              Paso 2 de 2
                            </span>
                          </div>

                          {/* Options grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Cash Option */}
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('efectivo')}
                              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 cursor-pointer ${
                                paymentMethod === 'efectivo'
                                  ? 'bg-black text-white border-black shadow-md'
                                  : 'bg-white text-black border-uber-gray-200 hover:bg-uber-gray-50'
                              }`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <span className="text-2xl">💵</span>
                                {paymentMethod === 'efectivo' && (
                                  <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold">✓</span>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold leading-tight">Efectivo</h4>
                                <p className={`text-[10px] mt-1 ${paymentMethod === 'efectivo' ? 'text-uber-gray-300' : 'text-uber-gray-500'}`}>
                                  Paga al conductor
                                </p>
                              </div>
                            </button>

                            {/* Transfer Option */}
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('transferencia')}
                              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 cursor-pointer ${
                                paymentMethod === 'transferencia'
                                  ? 'bg-black text-white border-black shadow-md'
                                  : 'bg-white text-black border-uber-gray-200 hover:bg-uber-gray-50'
                              }`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <span className="text-2xl">🏦</span>
                                {paymentMethod === 'transferencia' && (
                                  <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold">✓</span>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold leading-tight">Transferencia</h4>
                                <p className={`text-[10px] mt-1 ${paymentMethod === 'transferencia' ? 'text-uber-gray-300' : 'text-uber-gray-500'}`}>
                                  Paga cuando te acepten
                                </p>
                              </div>
                            </button>

                            {/* PayPal Option */}
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('paypal')}
                              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 cursor-pointer ${
                                paymentMethod === 'paypal'
                                  ? 'bg-black text-white border-black shadow-md'
                                  : 'bg-white text-black border-uber-gray-200 hover:bg-uber-gray-50'
                              }`}
                            >
                              <div className="flex justify-between items-start w-full">
                                <span className="text-2xl">💳</span>
                                {paymentMethod === 'paypal' && (
                                  <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold">✓</span>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold leading-tight">PayPal</h4>
                                <p className={`text-[10px] mt-1 ${paymentMethod === 'paypal' ? 'text-uber-gray-300' : 'text-uber-gray-500'}`}>
                                  Pago seguro online
                                </p>
                              </div>
                            </button>
                          </div>

                          {/* Detail panel */}
                          {paymentMethod === 'efectivo' ? (
                            <div className="p-3.5 bg-white border border-emerald-500 rounded-xl flex items-start gap-2.5">
                              <span className="text-base shrink-0">💡</span>
                              <p className="text-xs text-black leading-relaxed font-medium">
                                Has elegido pagar en efectivo. Podrás coordinar el pago al subir al vehículo una vez que el conductor acepte tu solicitud.
                              </p>
                            </div>
                          ) : paymentMethod === 'transferencia' ? (
                            <div className="p-3.5 bg-white border border-blue-100 rounded-xl flex items-start gap-2.5">
                              <span className="text-base shrink-0">ℹ️</span>
                              <p className="text-xs text-black leading-relaxed font-medium">
                                Podrás ver los datos bancarios del conductor en "Mis solicitudes" cuando el conductor apruebe tu viaje.
                              </p>
                            </div>
                          ) : (
                            <div className="p-3.5 bg-white border border-indigo-100 rounded-xl flex items-start gap-2.5">
                              <span className="text-base shrink-0">🛡️</span>
                              <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                                Procesarás el pago con PayPal una vez que el conductor acepte tu solicitud. Es 100% seguro.
                              </p>
                            </div>
                          )}

                          {/* Mensaje al conductor input */}
                          <div>
                            <label className="block text-[10px] font-bold text-uber-gray-500 uppercase tracking-wider mb-1.5 pl-1">
                              Mensaje al conductor (opcional)
                            </label>
                            <input
                              type="text"
                              placeholder="Escribe un mensaje al conductor (ej: Llevo mochila grande)..."
                              className="w-full px-4 py-3 bg-white rounded-xl text-sm text-black border border-uber-gray-200 outline-none focus:ring-2 focus:ring-black/10 focus:border-black placeholder-uber-gray-400"
                              value={requestMsg}
                              onChange={e => setRequestMsg(e.target.value)}
                            />
                          </div>

                          {/* Footer action buttons */}
                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowPaymentStep(false)}
                              className="flex-1 py-3.5 text-sm font-semibold bg-white border border-uber-gray-200 hover:bg-uber-gray-50 text-black rounded-xl transition-colors cursor-pointer"
                            >
                              Atrás
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRequestJoin(viewRide.id)}
                              className="flex-1 py-3.5 text-sm font-bold bg-black text-white hover:bg-uber-gray-800 rounded-xl transition-colors cursor-pointer border-none"
                            >
                              Confirmar y Solicitar
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button
                        onClick={() => {
                          if (!myProfile || !myProfile.career || !myProfile.phone) {
                            addToast('Por favor, actualiza tu perfil (carrera y teléfono) en la sección de Perfil antes de solicitar unirte a un viaje.', 'error');
                            return;
                          }
                          setShowPaymentStep(true);
                        }}
                        className="uber-btn-primary w-full py-3.5 text-sm font-bold tracking-wide"
                      >
                        Solicitar unirme al viaje
                      </button>
                    );
                  })()
                ) : (
                  <button
                    onClick={() => setViewRide(null)}
                    className="uber-btn-secondary w-full py-3 text-xs font-bold tracking-wider"
                  >
                    CERRAR
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};