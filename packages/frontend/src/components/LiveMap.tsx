import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Leaflet in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

interface LiveMapProps {
  origin?: MapPoint | null;
  destination?: MapPoint | null;
  currentPosition?: MapPoint | null;
  trackingPath?: { lat: number; lng: number }[];
  height?: string;
  onMapClick?: (lat: number, lng: number) => void;
  selectMode?: 'origin' | 'destination' | null;
  className?: string;
}

const createColorIcon = (color: string) => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="40">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="#fff"/>
    </svg>`;
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
};

const carIcon = L.divIcon({
  html: `<div style="font-size:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">🚗</div>`,
  className: 'car-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export const LiveMap: React.FC<LiveMapProps> = ({
  origin, destination, currentPosition, trackingPath,
  height = '400px', onMapClick, selectMode, className = '',
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [-0.1807, -78.4678], // Quito, Ecuador default
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle click events
  useEffect(() => {
    if (!mapRef.current || !onMapClick) return;

    const handler = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };

    mapRef.current.on('click', handler);
    return () => { mapRef.current?.off('click', handler); };
  }, [onMapClick]);

  // Update cursor style based on selection mode
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.cursor = selectMode ? 'crosshair' : '';
  }, [selectMode]);

  // Update markers and polyline
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    polylineRef.current?.remove();

    const bounds: L.LatLng[] = [];

    if (origin?.lat && origin?.lng) {
      const marker = L.marker([origin.lat, origin.lng], {
        icon: createColorIcon('#10b981'),
      }).addTo(mapRef.current)
        .bindPopup(`<b>📍 Origen</b><br/>${origin.label || 'Punto de partida'}`);
      markersRef.current.push(marker);
      bounds.push(L.latLng(origin.lat, origin.lng));
    }

    if (destination?.lat && destination?.lng) {
      const marker = L.marker([destination.lat, destination.lng], {
        icon: createColorIcon('#3b82f6'),
      }).addTo(mapRef.current)
        .bindPopup(`<b>🏁 Destino</b><br/>${destination.label || 'Destino'}`);
      markersRef.current.push(marker);
      bounds.push(L.latLng(destination.lat, destination.lng));
    }

    if (currentPosition?.lat && currentPosition?.lng) {
      const marker = L.marker([currentPosition.lat, currentPosition.lng], {
        icon: carIcon,
      }).addTo(mapRef.current)
        .bindPopup('<b>🚗 Posición actual</b>');
      markersRef.current.push(marker);
      bounds.push(L.latLng(currentPosition.lat, currentPosition.lng));
    }

    // Draw tracking path
    if (trackingPath && trackingPath.length > 1) {
      const pathCoords = trackingPath.map(p => [p.lat, p.lng] as [number, number]);
      polylineRef.current = L.polyline(pathCoords, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 6',
      }).addTo(mapRef.current);
      pathCoords.forEach(c => bounds.push(L.latLng(c[0], c[1])));
    }

    // Draw route line between origin and destination
    if (origin?.lat && origin?.lng && destination?.lat && destination?.lng && !trackingPath?.length) {
      polylineRef.current = L.polyline(
        [[origin.lat, origin.lng], [destination.lat, destination.lng]],
        { color: '#6366f1', weight: 3, opacity: 0.6, dashArray: '8, 8' },
      ).addTo(mapRef.current);
    }

    // Fit bounds
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        mapRef.current.setView(bounds[0], 15);
      } else {
        mapRef.current.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
      }
    }
  }, [origin, destination, currentPosition, trackingPath]);

  return (
    <div className={`rounded-2xl overflow-hidden border border-primary-200 shadow-card ${className}`}>
      <div ref={containerRef} style={{ height, width: '100%' }} />
      {selectMode && (
        <div className="bg-primary-50 px-4 py-2 text-sm text-primary-700 flex items-center gap-2">
          <span className="animate-pulse">📍</span>
          Haz clic en el mapa para seleccionar el punto de <strong>{selectMode === 'origin' ? 'origen' : 'destino'}</strong>
        </div>
      )}
    </div>
  );
};
