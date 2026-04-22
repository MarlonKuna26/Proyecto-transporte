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
    PUBLISHED:   { label: 'Publicado',   bg: '#f0f4fa', color: '#2d4f7a' },
    FULL:        { label: 'Lleno',       bg: '#fdf8f0', color: '#8a6a2e' },
    IN_PROGRESS: { label: 'En curso',    bg: '#f0faf4', color: '#2d7a4f' },
    COMPLETED:   { label: 'Completado',  bg: '#f0f4fa', color: '#2d4f7a' },
    CANCELLED:   { label: 'Cancelado',   bg: '#fdf2f2', color: '#c0392b' },
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      <div className="bg-white border border-[#d8d4cc] p-6" style={{ borderRadius: '4px' }}>
        <div className="h-64 bg-[#e8e4dc] mb-4" style={{ borderRadius: '2px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div className="h-3 bg-[#e8e4dc] rounded w-48 mx-auto" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  );

  if (!ride) return (
    <div className="max-w-4xl mx-auto px-4 py-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      <div className="bg-white border border-[#d8d4cc] p-12 text-center" style={{ borderRadius: '4px' }}>
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#fdf8f0] mb-4" style={{ borderRadius: '2px' }}>
          <MapIcon />
        </div>
        <p className="text-[#999] text-sm mb-4">Viaje no encontrado</p>
        <Link
          to="/rides"
          className="inline-block px-5 py-2.5 bg-[#1a1a2e] text-white text-xs font-medium tracking-widest uppercase hover:bg-[#2d2d4e] transition-colors"
          style={{ borderRadius: '2px', textDecoration: 'none' }}
        >
          ← Volver a viajes
        </Link>
      </div>
    </div>
  );

  const s = statusConfig[ride.status] || statusConfig.PUBLISHED;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .tr-card { background:#fff; border:0.5px solid #d8d4cc; border-radius:4px; }
        .status-badge { font-size:11px; font-weight:500; letter-spacing:0.06em; text-transform:uppercase; padding:3px 10px; border-radius:2px; }
        .section-label { font-size:11px; font-weight:500; color:#6b6b6b; letter-spacing:0.1em; text-transform:uppercase; }
        .tr-btn { padding:10px 20px; font-size:12px; font-weight:500; letter-spacing:0.08em; text-transform:uppercase; border:none; cursor:pointer; border-radius:2px; transition:background 0.2s; font-family:'DM Sans',sans-serif; }
        .tr-btn-primary { background:#1a1a2e; color:#fff; }
        .tr-btn-primary:hover { background:#2d2d4e; }
        .tr-btn-secondary { background:#fafaf8; color:#1a1a2e; border:0.5px solid #d8d4cc !important; }
        .tr-btn-secondary:hover { border-color:#1a1a2e !important; }
        .tr-btn-gold { background:#c8a96e; color:#1a1a2e; }
        .tr-btn-gold:hover { background:#d4b87a; }
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes gps-blink{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>

      {/* Page header */}
      <div className="tr-card overflow-hidden">
        <div className="bg-[#1a1a2e] px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl text-white tracking-wide" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}>
              Seguimiento en vivo
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[#8a8fa8] text-xs tracking-widest uppercase">
                {ride.originZone} → {ride.destinationZone}
              </p>
              <span className="status-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
            </div>
          </div>
          <Link
            to="/my-rides"
            className="tr-btn tr-btn-secondary shrink-0"
            style={{ textDecoration: 'none', border: '0.5px solid #d8d4cc' }}
          >
            ← Volver
          </Link>
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
          <button onClick={() => setFeedback('')} className="ml-auto bg-transparent border-none cursor-pointer text-current opacity-50 hover:opacity-100 text-base">✕</button>
        </div>
      )}

      {/* Map */}
      <div className="tr-card overflow-hidden">
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
        <div className="tr-card p-6">
          <p className="section-label mb-4">Controles del conductor</p>
          <div className="flex flex-wrap gap-3">
            {(ride.status === 'PUBLISHED' || ride.status === 'FULL') && (
              <button onClick={handleStartRide} className="tr-btn tr-btn-gold">
                Iniciar viaje
              </button>
            )}
            {ride.status === 'IN_PROGRESS' && (
              <>
                {!gpsActive ? (
                  <button onClick={startGPS} className="tr-btn tr-btn-primary">
                    Activar GPS
                  </button>
                ) : (
                  <button onClick={stopGPS} className="tr-btn" style={{ background: '#fafaf8', color: '#1a1a2e', border: '0.5px solid #d8d4cc', borderRadius: '2px' }}>
                    Pausar GPS
                  </button>
                )}
                <button onClick={handleCompleteRide} className="tr-btn tr-btn-primary">
                  Completar viaje
                </button>
              </>
            )}
          </div>

          {gpsActive && (
            <div className="mt-4 flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full bg-[#2d7a4f]"
                style={{ animation: 'gps-blink 1.2s ease-in-out infinite' }}
              />
              <span className="text-[#2d7a4f] text-xs tracking-wide">GPS activo — enviando ubicación cada 3 segundos</span>
            </div>
          )}
        </div>
      )}

      {/* Ride info */}
      <div className="tr-card p-6">
        <p className="section-label mb-4">Información del viaje</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { label: 'Fecha',    value: ride.departureDate },
            { label: 'Hora',     value: ride.departureTime },
            { label: 'Asientos', value: String(ride.availableSeats) },
            { label: 'Precio',   value: `$${ride.pricePerSeat?.toLocaleString()}`, gold: true },
          ].map(({ label, value, gold }) => (
            <div key={label}>
              <p className="text-[11px] text-[#999] tracking-widest uppercase mb-1">{label}</p>
              <p
                className="text-sm font-medium"
                style={{ color: gold ? '#c8a96e' : '#1a1a2e' }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Events timeline */}
      {events.length > 0 && (
        <div className="tr-card p-6">
          <p className="section-label mb-5">Historial de eventos</p>
          <div className="space-y-4">
            {events.map((evt, i) => (
              <div key={evt.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-0.5"
                    style={{ background: i === 0 ? '#c8a96e' : '#d8d4cc' }}
                  />
                  {i < events.length - 1 && (
                    <div className="w-px flex-1 bg-[#e8e4dc] mt-1" style={{ minHeight: '24px' }} />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-[#1a1a2e] text-sm font-medium">{evt.tipo_evento}</p>
                  {evt.descripcion && <p className="text-[#999] text-xs mt-0.5">{evt.descripcion}</p>}
                  <p className="text-[#bbb] text-xs mt-1">
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

/* ── Inline SVG icon ── */
const MapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);