import { useState } from 'react';
import { MapView } from '../components/MapView';
import { POIBottomSheet } from '../components/POIBottomSheet';
import type { Route } from '../data/types';

type Props = { route: Route };

export function MapScreen({ route }: Props) {
  const [activePoiId, setActivePoiId] = useState<string | null>(null);
  const activeIndex = activePoiId
    ? route.pois.findIndex((p) => p.id === activePoiId)
    : -1;
  const activePoi = activeIndex >= 0 ? route.pois[activeIndex] : null;

  return (
    <div className="fixed inset-0 flex flex-col">
      <div className="pt-safe border-b border-stone-200 bg-white/85 backdrop-blur z-[1000] shrink-0">
        <header className="flex items-center gap-3 px-3 h-14">
          <a
            href="#"
            className="w-10 h-10 grid place-items-center rounded-lg hover:bg-stone-100 active:bg-stone-200"
            aria-label="Назад"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <div className="min-w-0 flex-1">
            <h1 className="font-medium leading-tight truncate">{route.title}</h1>
            <p className="text-xs text-stone-500">
              {route.pois.length} точек · {(route.distanceMeters / 1000).toFixed(1)} км ·{' '}
              {route.durationMinutes} мин
            </p>
          </div>
        </header>
      </div>

      <div className="flex-1 relative">
        <MapView
          route={route}
          activePoiId={activePoiId}
          onSelectPoi={setActivePoiId}
        />
      </div>

      <POIBottomSheet
        poi={activePoi}
        index={activeIndex >= 0 ? activeIndex + 1 : 0}
        total={route.pois.length}
        onClose={() => setActivePoiId(null)}
      />
    </div>
  );
}
