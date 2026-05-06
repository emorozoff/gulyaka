import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L, { type Map as LMap } from 'leaflet';
import type { Route, LatLng } from '../data/types';
import { useGeolocation } from '../hooks/useGeolocation';

function FitBounds({ coords }: { coords: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    const bounds = L.latLngBounds(coords.map((c) => L.latLng(c[0], c[1])));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 17 });
  }, [coords, map]);
  return null;
}

function MapRefCapture({ mapRef }: { mapRef: React.RefObject<LMap | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

function poiIcon(n: number, active: boolean) {
  return L.divIcon({
    className: '',
    html: `<div class="poi-marker${active ? ' active' : ''}">${n}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const userIcon = L.divIcon({
  className: '',
  html: `<div class="user-marker"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

type Props = {
  route: Route;
  activePoiId: string | null;
  onSelectPoi: (id: string | null) => void;
};

export function MapView({ route, activePoiId, onSelectPoi }: Props) {
  const center: LatLng = route.pois[0]?.coords ?? [55.7625, 37.6411];
  const polylinePoints = useMemo(
    () => route.path ?? route.pois.map((p) => p.coords),
    [route],
  );
  const fitCoords = route.pois.map((p) => p.coords);
  const { position, error: geoError } = useGeolocation();
  const mapRef = useRef<LMap | null>(null);

  const recenter = () => {
    if (!position || !mapRef.current) return;
    mapRef.current.flyTo(
      [position.coords.latitude, position.coords.longitude],
      Math.max(mapRef.current.getZoom(), 17),
      { duration: 0.6 },
    );
  };

  return (
    <>
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom
        className="absolute inset-0"
        zoomControl={false}
      >
        <MapRefCapture mapRef={mapRef} />
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Polyline
          positions={polylinePoints}
          pathOptions={{
            color: '#1c1917',
            weight: 4,
            opacity: 0.85,
            dashArray: '6 8',
            lineCap: 'round',
          }}
        />
        {route.pois.map((poi, i) => (
          <Marker
            key={poi.id}
            position={poi.coords}
            icon={poiIcon(i + 1, activePoiId === poi.id)}
            eventHandlers={{ click: () => onSelectPoi(poi.id) }}
          />
        ))}
        {position && (
          <Marker
            position={[position.coords.latitude, position.coords.longitude]}
            icon={userIcon}
            interactive={false}
            keyboard={false}
          />
        )}
        <FitBounds coords={fitCoords} />
      </MapContainer>

      <button
        type="button"
        onClick={recenter}
        disabled={!position}
        className="absolute right-3 bottom-3 z-[400] w-11 h-11 grid place-items-center bg-white rounded-full shadow-lg border border-stone-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 active:scale-95 transition"
        aria-label="Найти меня на карте"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" fill="#2563eb" />
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="#1c1917"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M12 2v3M12 19v3M2 12h3M19 12h3"
            stroke="#1c1917"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {geoError && !position && (
        <div className="absolute left-3 right-3 top-3 z-[400] bg-white/95 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-600 shadow">
          Не удалось получить геолокацию. Карта работает, но без вашей точки.
        </div>
      )}
    </>
  );
}
