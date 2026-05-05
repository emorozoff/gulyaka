"use client";

import { useEffect, useRef } from "react";
import maplibregl, {
  type Map as MapLibreMap,
  type GeoJSONSource,
  type MapMouseEvent,
  type ExpressionSpecification,
} from "maplibre-gl";
import { MAP_STYLE_URL, PILOT_CENTER } from "@/lib/constants";
import type { POI, POIType } from "@/lib/types";

type PoiFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    properties: { slug: string; name: string; type: POIType };
    geometry: { type: "Point"; coordinates: [number, number] };
  }>;
};

const MARKER_LAYER_ID = "pois-marker";
const HALO_LAYER_ID = "pois-halo";
const SOURCE_ID = "pois";

const TYPE_COLORS: Record<POIType, string> = {
  monument: "#8b4513",
  church: "#3a4f5e",
  mansion: "#5a3b6c",
  soviet: "#6e3b3b",
  modernism: "#2f4d4a",
  building: "#a8442a",
  bridge: "#3b5a72",
  park: "#3d5a3a",
  other: "#5a4f3b",
};

const COLOR_EXPRESSION: ExpressionSpecification = [
  "match",
  ["get", "type"],
  "monument", TYPE_COLORS.monument,
  "church", TYPE_COLORS.church,
  "mansion", TYPE_COLORS.mansion,
  "soviet", TYPE_COLORS.soviet,
  "modernism", TYPE_COLORS.modernism,
  "building", TYPE_COLORS.building,
  "bridge", TYPE_COLORS.bridge,
  "park", TYPE_COLORS.park,
  "other", TYPE_COLORS.other,
  TYPE_COLORS.building,
];

type Props = {
  className?: string;
  pois: POI[];
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
};

export function Map({ className, pois, selectedSlug, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [PILOT_CENTER.lng, PILOT_CENTER.lat],
      zoom: PILOT_CENTER.zoom,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
      maxZoom: 19,
      minZoom: 11,
    });

    map.touchZoomRotate.disableRotation();

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
      }),
      "top-right",
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    map.on("load", () => {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: HALO_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            22,
            0,
          ],
          "circle-color": "#a8442a",
          "circle-opacity": 0.2,
          "circle-blur": 0.4,
        },
      });

      map.addLayer({
        id: MARKER_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            11,
            7,
          ],
          "circle-color": COLOR_EXPRESSION,
          "circle-stroke-color": "#faf9f6",
          "circle-stroke-width": 2,
        },
      });

      map.on("click", (event: MapMouseEvent) => {
        const features = map.queryRenderedFeatures(event.point, {
          layers: [MARKER_LAYER_ID],
        });
        const slug = features[0]?.properties?.slug as string | undefined;
        onSelectRef.current(slug ?? null);
      });

      map.on("mouseenter", MARKER_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", MARKER_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync POI data into the source.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const data = poisToGeoJSON(pois);
    const apply = () => {
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (source) source.setData(data);
    };

    if (map.isStyleLoaded() && map.getSource(SOURCE_ID)) apply();
    else map.once("load", apply);
  }, [pois]);

  // Sync selected feature-state.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      pois.forEach((p) => {
        map.removeFeatureState({ source: SOURCE_ID, id: p.slug });
      });
      if (selectedSlug) {
        map.setFeatureState(
          { source: SOURCE_ID, id: selectedSlug },
          { selected: true },
        );
        const target = pois.find((p) => p.slug === selectedSlug);
        if (target) {
          map.easeTo({
            center: [target.lng, target.lat],
            offset: [0, -120], // shift up so card doesn't cover the marker
            duration: 500,
          });
        }
      }
    };

    if (map.isStyleLoaded() && map.getSource(SOURCE_ID)) apply();
    else map.once("load", apply);
  }, [pois, selectedSlug]);

  return <div ref={containerRef} className={className} />;
}

function poisToGeoJSON(pois: POI[]): PoiFeatureCollection {
  return {
    type: "FeatureCollection",
    features: pois.map((p) => ({
      type: "Feature",
      id: p.slug,
      properties: { slug: p.slug, name: p.name, type: p.type },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    })),
  };
}

