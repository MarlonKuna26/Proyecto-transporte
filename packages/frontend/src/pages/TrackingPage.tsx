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
    // Auto-refresh tracking every 5 seconds
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
    if (!navigator.geolocation) {
      setFeedback('GPS no disponible en este navegador');
      return;
    }
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

  const statusLabel: Record<string, string> = {
    PUBLISHED: 'Publicado', FULL: 'Lleno', IN_PROGRESS: '🟢 En curso',
    COMPLETED: '✅ Completado', CANCELLED: '❌ Cancelado',
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-card p-12 animate-pulse text-center">
        <div className="h-64 bg-dark-200 rounded-xl mb-4" />
        <div className="h-4 bg-dark-200 rounded w-48 mx-auto" />
      </div>
    </div>
  );

  if (!ride) return (
    <div className="max-w-4xl mx-auto glass-card p-12 text-center">
      <p className="text-5xl mb-4">🗺️</p>
      <p className="text-dark-500 text-lg">Viaje no encontrado</p>
      <Link to="/rides" className="btn-primary inline-block mt-4">← Volver a viajes</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">📍 Seguimiento en vivo</h1>
          <p className="text-dark-400 text-sm mt-1">
            {ride.originZone} → {ride.destinationZone} •{' '}
            <span className="font-medium">{statusLabel[ride.status]}</span>
          </p>
        </div>
        <Link to="/my-rides" className="btn-secondary text-sm">← Volver</Link>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-primary-50 border border-primary-200 text-primary-700 text-sm flex items-center gap-2">
          ✅ {feedback}
          <button onClick={() => setFeedback('')} className="ml-auto text-dark-400">✕</button>
        </div>
      )}

      {/* Map */}
      <LiveMap
        origin={ride.originLat && ride.originLng ? { lat: ride.originLat, lng: ride.originLng, label: ride.originZone } : null}
        destination={ride.destinationLat && ride.destinationLng ? { lat: ride.destinationLat, lng: ride.destinationLng, label: ride.destinationZone } : null}
        currentPosition={currentPos ? { lat: Number(currentPos.latitud_actual), lng: Number(currentPos.longitud_actual) } : null}
        trackingPath={history.map(h => ({ lat: h.lat, lng: h.lng }))}
        height="450px"
      />

      {/* Driver controls */}
      {isDriver && (
        <div className="glass-card p-5">
          <h2 className="text-lg font-bold text-navy-900 mb-3">🎮 Controles del conductor</h2>
          <div className="flex flex-wrap gap-3">
            {(ride.status === 'PUBLISHED' || ride.status === 'FULL') && (
              <button onClick={handleStartRide} className="btn-accent">▶ Iniciar viaje</button>
            )}
            {ride.status === 'IN_PROGRESS' && (
              <>
                {!gpsActive ? (
                  <button onClick={startGPS} className="btn-primary">📡 Activar GPS</button>
                ) : (
                  <button onClick={stopGPS} className="btn-secondary">⏸ Pausar GPS</button>
                )}
                <button onClick={handleCompleteRide} className="btn-accent">⏹ Completar viaje</button>
              </>
            )}
          </div>
          {gpsActive && (
            <div className="mt-3 flex items-center gap-2 text-sm text-primary-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              GPS activo — enviando ubicación cada 3 segundos
            </div>
          )}
        </div>
      )}

      {/* Ride info */}
      <div className="glass-card p-5">
        <h2 className="text-lg font-bold text-navy-900 mb-3">📋 Información del viaje</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-dark-400 text-xs">Fecha</p>
            <p className="text-navy-900 font-medium">📅 {ride.departureDate}</p>
          </div>
          <div>
            <p className="text-dark-400 text-xs">Hora</p>
            <p className="text-navy-900 font-medium">🕐 {ride.departureTime}</p>
          </div>
          <div>
            <p className="text-dark-400 text-xs">Asientos</p>
            <p className="text-navy-900 font-medium">💺 {ride.availableSeats}</p>
          </div>
          <div>
            <p className="text-dark-400 text-xs">Precio</p>
            <p className="text-primary-600 font-bold">${ride.pricePerSeat?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Events timeline */}
      {events.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-lg font-bold text-navy-900 mb-3">📜 Historial de eventos</h2>
          <div className="space-y-3">
            {events.map((evt, i) => (
              <div key={evt.id} className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-navy-900 text-sm font-medium">{evt.tipo_evento}</p>
                  {evt.descripcion && <p className="text-dark-400 text-xs">{evt.descripcion}</p>}
                  <p className="text-dark-300 text-xs mt-0.5">{new Date(evt.creado_en).toLocaleString('es')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
