/**
 * Wikidata API client. Uses `wbgetentities` (action API) — accepts up to 50
 * QIDs per request and returns labels, descriptions, claims, and sitelinks
 * in one call. We're after a few specific properties:
 *
 *   P18  — image (Commons filename)
 *   P571 — inception (date)
 *   P84  — architect (entity)
 *   P625 — coordinate location (fallback if OSM has no center)
 *   P1435 — heritage status
 */

import type { WikidataEntity } from "../types";

const ENDPOINT = "https://www.wikidata.org/w/api.php";
const BATCH_SIZE = 50;

type WbGetEntitiesResponse = {
  entities: Record<string, WikidataEntity>;
};

export async function fetchEntities(
  qids: string[],
): Promise<Map<string, WikidataEntity>> {
  const result = new Map<string, WikidataEntity>();
  const unique = [...new Set(qids.filter((q) => /^Q\d+$/.test(q)))];

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const params = new URLSearchParams({
      action: "wbgetentities",
      ids: batch.join("|"),
      languages: "ru|en",
      props: "labels|descriptions|claims|sitelinks/urls",
      sitefilter: "ruwiki|enwiki",
      format: "json",
      formatversion: "2",
    });

    const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
      headers: {
        "User-Agent":
          "Gulyaka/0.1 (content pipeline; https://github.com/emorozoff/gulyaka)",
      },
    });

    if (!res.ok) {
      throw new Error(`Wikidata wbgetentities → HTTP ${res.status}`);
    }

    const json = (await res.json()) as WbGetEntitiesResponse;
    for (const [id, entity] of Object.entries(json.entities ?? {})) {
      result.set(id, entity);
    }

    // Be polite to a free public API.
    if (i + BATCH_SIZE < unique.length) await sleep(200);
  }

  return result;
}

export function getImageFilename(entity: WikidataEntity): string | undefined {
  const claim = entity.claims?.P18?.[0];
  const dv = claim?.mainsnak?.datavalue;
  return dv?.type === "string" ? dv.value : undefined;
}

export function getInceptionYear(entity: WikidataEntity): number | undefined {
  const claim = entity.claims?.P571?.[0];
  const dv = claim?.mainsnak?.datavalue;
  if (dv?.type !== "time") return undefined;
  // Format: "+1815-00-00T00:00:00Z" — first digits after the sign.
  const match = /^[+-](\d{1,4})/.exec(dv.value.time);
  return match ? Number(match[1]) : undefined;
}

export function getArchitectQid(entity: WikidataEntity): string | undefined {
  const claim = entity.claims?.P84?.[0];
  const dv = claim?.mainsnak?.datavalue;
  return dv?.type === "wikibase-entityid" ? dv.value.id : undefined;
}

export function getCoordinate(
  entity: WikidataEntity,
): { lat: number; lng: number } | undefined {
  const claim = entity.claims?.P625?.[0];
  const dv = claim?.mainsnak?.datavalue;
  if (dv?.type !== "globecoordinate") return undefined;
  return { lat: dv.value.latitude, lng: dv.value.longitude };
}

export function getLabel(
  entity: WikidataEntity,
  lang: "ru" | "en",
): string | undefined {
  return entity.labels?.[lang]?.value;
}

export function getDescription(
  entity: WikidataEntity,
  lang: "ru" | "en",
): string | undefined {
  return entity.descriptions?.[lang]?.value;
}

export function getWikipediaLink(
  entity: WikidataEntity,
  lang: "ru" | "en",
): { lang: "ru" | "en"; title: string; url: string } | undefined {
  const sitelink = entity.sitelinks?.[`${lang}wiki`];
  if (!sitelink) return undefined;
  return {
    lang,
    title: sitelink.title,
    url:
      sitelink.url ??
      `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(sitelink.title.replace(/ /g, "_"))}`,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
