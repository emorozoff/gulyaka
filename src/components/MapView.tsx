import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
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
  const { position } = useGeolocation();

  return (
    <MapContainer
      center={center}
      zoom={16}
      scrollWheelZoom
      className="absolute inset-0"
      zoomControl={false}
    >
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
  );
}
