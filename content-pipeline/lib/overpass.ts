/**
 * Overpass API client. Uses the public mirror at overpass-api.de.
 *
 * Querying strategy: pull every node/way/relation in the bounding box that has
 * at least one of: `wikidata`, `heritage`, `historic`, `tourism=attraction`,
 * `building` with notable architectural details. We dedupe by OSM id later.
 *
 * Bounding box convention in Overpass QL: (south, west, north, east).
 */

import type { OverpassResponse, Zone } from "../types";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];

function buildQuery(zone: Zone): string {
  const [s, w] = zone.sw;
  const [n, e] = zone.ne;
  const bbox = `${s},${w},${n},${e}`;

  return `
[out:json][timeout:60];
(
  nwr["wikidata"](${bbox});
  nwr["heritage"](${bbox});
  nwr["historic"~"^(monument|memorial|building|church|chapel|mansion|manor|castle|tomb|ruins|archaeological_site)$"](${bbox});
  nwr["tourism"="attraction"](${bbox});
  nwr["tourism"="artwork"](${bbox});
  nwr["man_made"="bridge"](${bbox});
  nwr["bridge"~"^(yes|aqueduct|movable|covered|trestle)$"](${bbox});
);
out center tags;
`.trim();
}

export async function queryOverpass(zone: Zone): Promise<OverpassResponse> {
  const query = buildQuery(zone);
  const body = new URLSearchParams({ data: query }).toString();

  let lastError: unknown;
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Gulyaka/0.1 (content pipeline; https://github.com/emorozoff/gulyaka)",
        },
        body,
      });

      if (res.status === 429) {
        await sleep(5000);
        continue;
      }

      if (!res.ok) {
        throw new Error(`Overpass ${endpoint} → HTTP ${res.status}`);
      }

      return (await res.json()) as OverpassResponse;
    } catch (error) {
      lastError = error;
      console.warn(`[overpass] ${endpoint} failed:`, error);
      continue;
    }
  }

  throw new Error(
    `All Overpass endpoints failed. Last error: ${String(lastError)}`,
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
