"use client";

import { useState } from "react";
import { Map } from "@/components/map/map";
import { PoiCard } from "@/components/poi/poi-card";
import { findMockPOI, MOCK_POIS } from "@/lib/mock-pois";

export function MapShell() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const selectedPoi = selectedSlug ? findMockPOI(selectedSlug) ?? null : null;

  return (
    <>
      <Map
        className="absolute inset-0"
        pois={MOCK_POIS}
        selectedSlug={selectedSlug}
        onSelect={setSelectedSlug}
      />
      <PoiCard poi={selectedPoi} onClose={() => setSelectedSlug(null)} />
    </>
  );
}
