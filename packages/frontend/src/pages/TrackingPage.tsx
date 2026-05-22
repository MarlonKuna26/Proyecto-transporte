import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { LiveMap } from '@/components/LiveMap';
import { useAuth } from '@/context/AuthContext';
import { ToastContainer, type ToastMessage } from '@/components/Toast';
import type { Ride, TrackingPoint, TrackingHistoryPoint, RideEvent } from '@/types';

export const TrackingPage: React.FC = () => {
  const { rideId } = useParams<{ rideId: string }>();
  const { user } = useAuth();
  const [ride, setRide] = useState<Ride | null>(null);
  const [currentPos, setCurrentPos] = useState<TrackingPoint | null>(null);
  const [history, setHistory] = useState<TrackingHistoryPoint[]>([]);
  const [events, setEvents] = useState<RideEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDriver, setIsDriver] = useState(false);
  const [gpsActive, setGpsActive] = useState(false);
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  
  // ETA States
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const watchRef = useRef<number>();

  // ===== TOAST FUNCTIONS =====
  const addToast = (msg: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { id, msg, type, duration }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  useEffect(() => {
    if (!rideId) return;
    loadData();
    intervalRef.current = setInterval(refreshTracking, 5000);
    return () => {
      clearInterval(intervalRef.current);
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [rideId]);

  const loadData = async () => {
    try {
      const [rideRes, trackRes, histRes, evtRes] = await Promise.all([
        api.rides.getById(rideId!),
        api.tracking.getCurrent(rideId!),
        api.tracking.getHistory(rideId!),
        api.tracking.getEvents(rideId!),
      ]);
      setRide(rideRes.data);
      setCurrentPos(trackRes.data);
      setHistory(histRes.data || []);
      setEvents(evtRes.data || []);
      setIsDriver(rideRes.data?.driverId === user?.id);
    } catch { }
    setLoading(false);
  };

  const refreshTracking = async () => {
    try {
      const [trackRes, histRes] = await Promise.all([
        api.tracking.getCurrent(rideId!),
        api.tracking.getHistory(rideId!),
      ]);
      setCurrentPos(trackRes.data);
      setHistory(histRes.data || []);
    } catch { }
  };

  // ETA Calculation
  useEffect(() => {
    if (!ride) return;
    
    // Always set default values first
    setTotalDistance(15);
    setEtaMinutes(25);

    // If we have coordinates, calculate better estimate
    if (ride.originLat && ride.originLng && ride.destinationLat && ride.destinationLng) {
      const distance = getDistanceFromLatLonInKm(ride.originLat, ride.originLng, ride.destinationLat, ride.destinationLng);
      setTotalDistance(distance);
      setEtaMinutes(Math.max(5, Math.ceil((distance / 40) * 60)));

      // Try OSRM for even better estimate
      const url = `https://router.project-osrm.org/route/v1/driving/${ride.originLng},${ride.originLat};${ride.destinationLng},${ride.destinationLat}?overview=false`;
      
      fetch(url, { timeout: 5000 })
        .then(res => res.json())
        .then(data => {
          if (data.code === 'Ok' && data.routes?.[0]) {
            const durationSec = data.routes[0].duration;
            const distanceM = data.routes[0].distance;
            setEtaMinutes(Math.max(1, Math.ceil(durationSec / 60)));
            setTotalDistance(distanceM / 1000);
          }
        })
        .catch(err => {
          console.log('OSRM failed, using Haversine estimate');
        });
    } else {
      console.log('Coordinates not available, using default estimate');
    }
  }, [ride]);

  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }

  // Elapsed time calculation
  useEffect(() => {
    if (ride?.status !== 'IN_PROGRESS') return;
    
    const startEvent = events.find(e => e.tipo_evento === 'STARTED');
    if (!startEvent) return;

    const startTime = new Date(startEvent.creado_en).getTime();
    
    const updateElapsed = () => {
      const now = Date.now();
      const diffMins = Math.floor((now - startTime) / 60000);
      setElapsedMinutes(Math.max(0, diffMins));
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [ride?.status, events]);

  const startGPS = () => {
    if (!navigator.geolocation) { addToast('GPS no disponible en este navegador', 'error'); return; }
    setGpsActive(true);
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await api.tracking.updateLocation(rideId!, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading || undefined,
            speed: pos.coords.speed || undefined,
          });
        } catch { }
      },
      (err) => { addToast('Error GPS: ' + err.message, 'error'); },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );
  };

  const stopGPS = () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    setGpsActive(false);
  };

  const handleStartRide = async () => {
    try {
      await api.tracking.startRide(rideId!);
      addToast('¡Viaje iniciado!', 'success');
      loadData();
      startGPS();
    } catch (err: any) { addToast(err.message || 'Error al iniciar el viaje', 'error'); }
  };

  const handleCompleteRide = async () => {
    try {
      stopGPS();
      await api.tracking.completeRide(rideId!);
      addToast('¡Viaje completado!', 'success');
      loadData();
    } catch (err: any) { addToast(err.message || 'Error al completar el viaje', 'error'); }
  };

  const isCompleteAllowed = etaMinutes === null ? true : elapsedMinutes >= Math.max(0, Math.floor(etaMinutes * 0.7));

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    PUBLISHED:   { label: 'Disponible',  bg: '#E6F4EA', color: '#06C167' },
    FULL:        { label: 'Lleno',       bg: '#FFF3E0', color: '#FF6937' },
    IN_PROGRESS: { label: 'En curso',    bg: '#E8F0FE', color: '#276EF1' },
    COMPLETED:   { label: 'Completado',  bg: '#F6F6F6', color: '#545454' },
    CANCELLED:   { label: 'Cancelado',   bg: '#FDECEA', color: '#E11900' },
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="bg-white border border-uber-gray-100 p-6 rounded-2xl animate-pulse space-y-4">
        <div className="h-64 bg-uber-gray-50 rounded-xl" />
        <div className="h-4 bg-uber-gray-50 rounded w-1/3 mx-auto" />
      </div>
    </div>
  );

  if (!ride) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-uber-gray-100 p-12 text-center rounded-3xl shadow-uber-sm max-w-xl mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-uber-gray-50 rounded-full mb-6 text-black">
          <MapIcon />
        </div>
        <h3 className="text-xl font-bold text-black mb-2">Viaje no encontrado</h3>
        <p className="text-sm text-uber-gray-500 mb-6 max-w-xs mx-auto">El viaje solicitado no existe o ha sido eliminado.</p>
        <Link
          to="/rides"
          className="uber-btn-primary inline-flex items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          ← Volver a viajes
        </Link>
      </div>
    </div>
  );

  const s = statusConfig[ride.status] || statusConfig.PUBLISHED;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Page header */}
      <div className="bg-white rounded-2xl border border-uber-gray-100 shadow-uber-sm overflow-hidden animate-fade-in">
        <div className="bg-black text-white px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Seguimiento en vivo
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                {ride.originZone} → {ride.destinationZone}
              </p>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap"
                style={{ background: s.bg, color: s.color }}
              >
                {s.label}
              </span>
            </div>
          </div>
          <Link
            to="/my-rides"
            className="px-4 py-2 text-xs font-bold bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
            style={{ textDecoration: 'none' }}
          >
            ← Volver
          </Link>
        </div>
      </div>

      {/* Feedback */}
      <ToastContainer messages={messages} onClose={removeToast} />

      {/* Map */}
      <div className="bg-white rounded-2xl border border-uber-gray-100 shadow-uber-sm overflow-hidden animate-fade-in relative">
        <LiveMap
          origin={
            ride.originLat && ride.originLng 
              ? { lat: ride.originLat, lng: ride.originLng, label: ride.originZone } 
              : { lat: -1.2491, lng: -78.6167, label: ride.originZone }
          }
          destination={
            ride.destinationLat && ride.destinationLng 
              ? { lat: ride.destinationLat, lng: ride.destinationLng, label: ride.destinationZone } 
              : { lat: -1.2491, lng: -78.6167, label: ride.destinationZone }
          }
          currentPosition={currentPos ? { lat: Number(currentPos.latitud_actual), lng: Number(currentPos.longitud_actual) } : null}
          trackingPath={history.map(h => ({ lat: h.lat, lng: h.lng }))}
          height="450px"
        />

        {/* ETA Overlay Card */}
        {ride.status === 'IN_PROGRESS' && (
          <div className="absolute top-4 left-4 z-[400] bg-white shadow-uber-md border border-uber-gray-100 rounded-2xl p-5 flex flex-col min-w-[260px]">
            <span className="text-[10px] font-bold text-uber-gray-500 uppercase tracking-wider">Seguimiento en vivo</span>
            
            {/* Origin and Destination */}
            <div className="mt-3 space-y-2 pb-3 border-b border-uber-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-black truncate">{ride.originZone}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-blue-500" style={{ borderRadius: '2px' }} />
                <span className="text-xs font-semibold text-black truncate">{ride.destinationZone}</span>
              </div>
            </div>

            {/* Main Time Display */}
            {etaMinutes !== null ? (
              <>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-black">{Math.max(0, etaMinutes - elapsedMinutes)}</span>
                  <span className="text-xs font-bold text-uber-gray-500">min</span>
                  {totalDistance !== null && (
                    <span className="text-xs font-bold text-uber-gray-400 ml-2">{totalDistance.toFixed(1)} km</span>
                  )}
                </div>

                {/* Sub info - Total time and elapsed */}
                <div className="mt-2 text-[11px] text-uber-gray-600 font-medium space-y-1">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold text-black">{etaMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transcurrido:</span>
                    <span className="font-bold text-black">{elapsedMinutes} min</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-uber-gray-200 h-2 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-1000 ease-out rounded-full" 
                    style={{ width: `${Math.min(100, (elapsedMinutes / Math.max(1, etaMinutes)) * 100)}%` }} 
                  />
                </div>

                {/* Progress percentage */}
                <div className="mt-2 text-[10px] font-semibold text-uber-gray-600 text-center">
                  {Math.round(Math.min(100, (elapsedMinutes / Math.max(1, etaMinutes)) * 100))}% completado
                </div>
              </>
            ) : (
              <div className="mt-3 text-xs text-uber-gray-500 font-medium animate-pulse">
                Calculando...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Driver controls */}
      {isDriver && (
        <div className="bg-white rounded-2xl border border-uber-gray-100 shadow-uber-sm p-6 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-uber-gray-400 uppercase tracking-wider pl-1">
              Controles del conductor
            </p>
            
            {ride.status === 'IN_PROGRESS' && !isCompleteAllowed && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                Falta para poder completar el viaje ({Math.max(0, Math.floor(etaMinutes! * 0.7) - elapsedMinutes)} min)
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {(ride.status === 'PUBLISHED' || ride.status === 'FULL') && (
              <button
                onClick={handleStartRide}
                className="px-4 py-2.5 text-xs font-bold bg-black text-white hover:bg-zinc-800 rounded-lg transition-colors border-none cursor-pointer shadow-sm uppercase tracking-wide"
              >
                Iniciar viaje
              </button>
            )}
            {ride.status === 'IN_PROGRESS' && (
              <>
                {!gpsActive ? (
                  <button
                    onClick={startGPS}
                    className="px-4 py-2.5 text-xs font-bold bg-uber-blue text-white hover:bg-blue-700 rounded-lg transition-colors border-none cursor-pointer shadow-sm uppercase tracking-wide"
                  >
                    Activar GPS
                  </button>
                ) : (
                  <button
                    onClick={stopGPS}
                    className="px-4 py-2.5 text-xs font-bold bg-white text-uber-gray-700 hover:bg-uber-gray-100 border border-uber-gray-200 rounded-lg transition-all cursor-pointer uppercase tracking-wide"
                  >
                    Pausar GPS
                  </button>
                )}
                <button
                  onClick={handleCompleteRide}
                  disabled={!isCompleteAllowed}
                  className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-colors border-none shadow-sm uppercase tracking-wide ${
                    isCompleteAllowed 
                      ? 'bg-black text-white hover:bg-zinc-800 cursor-pointer' 
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  Completar viaje
                </button>
              </>
            )}
          </div>

          {gpsActive && (
            <div className="mt-2 flex items-center gap-2 text-uber-green bg-green-50 border border-green-150 px-3 py-2 rounded-xl text-xs font-semibold max-w-sm">
              <span
                className="w-2.5 h-2.5 rounded-full bg-uber-green shrink-0 animate-ping"
              />
              <span>GPS activo — transmitiendo ubicación en vivo</span>
            </div>
          )}
        </div>
      )}

      {/* Ride info */}
      <div className="bg-white rounded-2xl border border-uber-gray-100 shadow-uber-sm p-6 space-y-4 animate-fade-in">
        <p className="text-[10px] font-bold text-uber-gray-400 uppercase tracking-wider pl-1">
          Información del viaje
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            { label: 'Fecha',    value: ride.departureDate, isHighlight: false },
            { label: 'Hora',     value: ride.departureTime, isHighlight: false },
            { label: 'Asientos', value: `${ride.availableSeats} disponibles`, isHighlight: false },
            { label: 'Precio',   value: `$${ride.pricePerSeat?.toLocaleString()}`, isHighlight: true },
          ].map(({ label, value, isHighlight }) => (
            <div key={label} className="bg-uber-gray-50/50 p-4 rounded-xl border border-uber-gray-100">
              <p className="text-[10px] text-uber-gray-400 tracking-wider uppercase font-bold mb-1">{label}</p>
              <p className={`text-sm font-extrabold ${isHighlight ? 'text-black text-base font-black' : 'text-uber-gray-800'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Events timeline */}
      {events.length > 0 && (
        <div className="bg-white rounded-2xl border border-uber-gray-100 shadow-uber-sm p-6 space-y-4 animate-fade-in">
          <p className="text-[10px] font-bold text-uber-gray-400 uppercase tracking-wider pl-1">
            Historial de eventos
          </p>
          <div className="space-y-4 pl-1">
            {events.map((evt, i) => (
              <div key={evt.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      i === 0 ? 'bg-black ring-4 ring-black/10' : 'bg-zinc-300'
                    }`}
                  />
                  {i < events.length - 1 && (
                    <div className="w-0.5 flex-1 bg-zinc-200 mt-2" style={{ minHeight: '24px' }} />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-black text-sm font-bold leading-none">
                    {evt.tipo_evento === 'STARTED' ? 'Viaje Iniciado' : evt.tipo_evento === 'COMPLETED' ? 'Viaje Completado' : evt.tipo_evento}
                  </p>
                  {evt.descripcion && <p className="text-uber-gray-500 text-xs mt-1.5 font-medium leading-relaxed bg-uber-gray-50 px-3 py-1.5 rounded-lg border border-uber-gray-100/50 inline-block">"{evt.descripcion}"</p>}
                  <p className="text-uber-gray-400 text-[10px] font-semibold mt-2">
                    {new Date(evt.creado_en).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Inline SVG icons ── */
const MapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);
