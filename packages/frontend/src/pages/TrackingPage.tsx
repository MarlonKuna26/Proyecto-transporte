import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { LiveMap } from '@/components/LiveMap';
import { useAuth } from '@/context/AuthContext';
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
  const [feedback, setFeedback] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const watchRef = useRef<number>();

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

  const startGPS = () => {
    if (!navigator.geolocation) { setFeedback('GPS no disponible en este navegador'); return; }
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
      (err) => { setFeedback('Error GPS: ' + err.message); },
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
      setFeedback('¡Viaje iniciado!');
      loadData();
      startGPS();
    } catch (err: any) { setFeedback(err.message); }
  };

  const handleCompleteRide = async () => {
    try {
      stopGPS();
      await api.tracking.completeRide(rideId!);
      setFeedback('¡Viaje completado!');
      loadData();
    } catch (err: any) { setFeedback(err.message); }
  };

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
      {feedback && (
        <div className="flex items-center gap-3 px-4 py-3 text-sm rounded-xl border border-green-200 bg-green-50 text-uber-green animate-fade-in">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span className="font-semibold">{feedback}</span>
          <button onClick={() => setFeedback('')} className="ml-auto bg-transparent border-none cursor-pointer text-current opacity-60 hover:opacity-100 text-base">✕</button>
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-2xl border border-uber-gray-100 shadow-uber-sm overflow-hidden animate-fade-in">
        <LiveMap
          origin={ride.originLat && ride.originLng ? { lat: ride.originLat, lng: ride.originLng, label: ride.originZone } : null}
          destination={ride.destinationLat && ride.destinationLng ? { lat: ride.destinationLat, lng: ride.destinationLng, label: ride.destinationZone } : null}
          currentPosition={currentPos ? { lat: Number(currentPos.latitud_actual), lng: Number(currentPos.longitud_actual) } : null}
          trackingPath={history.map(h => ({ lat: h.lat, lng: h.lng }))}
          height="450px"
        />
      </div>

      {/* Driver controls */}
      {isDriver && (
        <div className="bg-white rounded-2xl border border-uber-gray-100 shadow-uber-sm p-6 space-y-4 animate-fade-in">
          <p className="text-[10px] font-bold text-uber-gray-400 uppercase tracking-wider pl-1">
            Controles del conductor
          </p>
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
                  className="px-4 py-2.5 text-xs font-bold bg-black text-white hover:bg-zinc-800 rounded-lg transition-colors border-none cursor-pointer shadow-sm uppercase tracking-wide"
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