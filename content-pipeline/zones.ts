import type { Zone } from "./types";

/**
 * Pilot zones — start tight around Чистые пруды, expand outward in waves.
 *
 * Bounding boxes are intentionally generous (~1km square) to catch buildings
 * along nearby streets. We filter results downstream by relevance.
 */
export const ZONES: Record<string, Zone> = {
  "chistye-prudy": {
    slug: "chistye-prudy",
    title: "Чистые пруды",
    // ~1.2 × 1.0 km box covering the pond, Чистопрудный/Покровский бульвары,
    // часть Мясницкой, Покровки, Маросейки, Архангельский, Кривоколенный.
    sw: [55.7565, 37.6315],
    ne: [55.7675, 37.6505],
    notes:
      "Пилотная зона: пруд + Чистопрудный/Покровский бульвары, прилегающие переулки и кусок Мясницкой/Покровки.",
  },
};

export function getZone(slug: string): Zone {
  const zone = ZONES[slug];
  if (!zone) {
    throw new Error(
      `Zone "${slug}" not found. Available: ${Object.keys(ZONES).join(", ")}`,
    );
  }
  return zone;
}
