/**
 * Stage 1 of the content pipeline.
 *
 * Pulls building/monument/bridge candidates in a zone from OSM (via Overpass),
 * enriches them with Wikidata metadata and Commons image URLs, then writes a
 * single JSON file that human editors review before content is written.
 *
 * Usage:
 *   pnpm content:fetch                   # default zone: chistye-prudy
 *   pnpm content:fetch -- some-other     # specify zone slug
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { queryOverpass } from "./lib/overpass";
import { fetchEntities, getArchitectQid, getCoordinate, getDescription, getImageFilename, getInceptionYear, getLabel, getWikipediaLink } from "./lib/wikidata";
import { buildCommonsUrls } from "./lib/commons";
import { bestName, buildAddress, classifyOSMTags } from "./lib/osm-tags";
import { slugify } from "./lib/slug";
import { getZone } from "./zones";
import type { Candidate, OverpassElement } from "./types";

const ROOT = resolve(import.meta.dirname, "..");

async function main() {
  const zoneSlug = process.argv[2] ?? "chistye-prudy";
  const zone = getZone(zoneSlug);

  console.log(`📍 Зона: ${zone.title} (${zone.slug})`);
  console.log(`   bbox: SW ${zone.sw}  ↗  NE ${zone.ne}`);

  console.log("\n→ Запрос в Overpass...");
  const overpass = await queryOverpass(zone);
  console.log(`  получено элементов: ${overpass.elements.length}`);

  // Dedup by (type, id) — same physical object may be queried multiple times
  // (once via wikidata, once via heritage tag, etc.).
  const elements = dedupeElements(overpass.elements);
  console.log(`  после дедупликации:  ${elements.length}`);

  // Collect all wikidata QIDs to enrich in batches.
  const qids = elements
    .map((el) => el.tags?.["wikidata"])
    .filter((q): q is string => !!q && /^Q\d+$/.test(q));
  const uniqueQids = [...new Set(qids)];
  console.log(`\n→ Wikidata: запрашиваем ${uniqueQids.length} QID...`);
  const wd = await fetchEntities(uniqueQids);
  console.log(`  получено сущностей:   ${wd.size}`);

  // Resolve architect labels in a second batch.
  const architectQids = [...wd.values()]
    .map((e) => getArchitectQid(e))
    .filter((q): q is string => !!q);
  const architects = architectQids.length
    ? await fetchEntities([...new Set(architectQids)])
    : new Map<string, never>();

  console.log(`\n→ Сборка кандидатов...`);
  const candidates: Candidate[] = [];
  let droppedNoImage = 0;
  let droppedNoCoords = 0;
  let droppedNoName = 0;

  for (const el of elements) {
    const tags = el.tags ?? {};
    const wikidataId = tags["wikidata"];
    const entity = wikidataId ? wd.get(wikidataId) : undefined;

    // Image: prefer Wikidata P18, otherwise drop (photo is mandatory).
    const imageFile = entity ? getImageFilename(entity) : undefined;
    if (!imageFile) {
      droppedNoImage++;
      continue;
    }

    // Coordinates: prefer OSM (more precise for buildings), fall back to Wikidata.
    const coords = elementCoords(el) ?? (entity ? getCoordinate(entity) : undefined);
    if (!coords) {
      droppedNoCoords++;
      continue;
    }

    // Name: prefer OSM Russian, then Wikidata Russian, then English.
    const nameRu =
      bestName(tags) ?? (entity && getLabel(entity, "ru")) ?? (entity && getLabel(entity, "en"));
    if (!nameRu) {
      droppedNoName++;
      continue;
    }

    const nameEn = entity ? getLabel(entity, "en") : tags["name:en"];
    const description = entity ? getDescription(entity, "ru") ?? getDescription(entity, "en") : undefined;
    const builtYear = entity ? getInceptionYear(entity) : undefined;
    const architectQid = entity ? getArchitectQid(entity) : undefined;
    const architectEntity = architectQid ? architects.get(architectQid) : undefined;
    const architect = architectEntity ? getLabel(architectEntity, "ru") ?? getLabel(architectEntity, "en") : undefined;
    const wpRu = entity ? getWikipediaLink(entity, "ru") : undefined;
    const wpEn = entity ? getWikipediaLink(entity, "en") : undefined;

    const slug = `${slugify(nameRu)}-${el.id}`;

    candidates.push({
      slug,
      name_ru: nameRu,
      name_en: nameEn,
      description,
      type: classifyOSMTags(tags),
      address: buildAddress(tags),
      lat: coords.lat,
      lng: coords.lng,
      built_year: builtYear,
      architect,
      image: buildCommonsUrls(imageFile),
      sources: {
        osm: {
          type: el.type,
          id: el.id,
          url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        },
        wikidata: wikidataId
          ? { id: wikidataId, url: `https://www.wikidata.org/wiki/${wikidataId}` }
          : undefined,
        wikipedia: wpRu ?? wpEn,
      },
      osm_tags: tags,
    });
  }

  // Sort: bridges/monuments/churches/mansions first, then buildings; alphabetic within type.
  const TYPE_ORDER: Record<Candidate["type"], number> = {
    monument: 1, church: 2, bridge: 3, mansion: 4, soviet: 5,
    modernism: 6, building: 7, park: 8, other: 9,
  };
  candidates.sort((a, b) => {
    const tDiff = TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    if (tDiff !== 0) return tDiff;
    return a.name_ru.localeCompare(b.name_ru, "ru");
  });

  const outDir = resolve(ROOT, "content", "candidates");
  await mkdir(outDir, { recursive: true });
  const outPath = resolve(outDir, `${zone.slug}.json`);
  await writeFile(outPath, JSON.stringify({ zone, candidates, generated_at: new Date().toISOString() }, null, 2));

  console.log(`\n✓ Записано: ${outPath}`);
  console.log(`\nРезультат: ${candidates.length} кандидатов с фото`);
  console.log(`  отброшено без фото:        ${droppedNoImage}`);
  console.log(`  отброшено без координат:   ${droppedNoCoords}`);
  console.log(`  отброшено без названия:    ${droppedNoName}`);
  console.log(`\nДальше: pnpm content:preview ${zone.slug}`);
}

function dedupeElements(elements: OverpassElement[]): OverpassElement[] {
  const seen = new Map<string, OverpassElement>();
  for (const el of elements) {
    seen.set(`${el.type}/${el.id}`, el);
  }
  return [...seen.values()];
}

function elementCoords(el: OverpassElement): { lat: number; lng: number } | undefined {
  if (typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  return undefined;
}

main().catch((error) => {
  console.error("\n✗ Ошибка пайплайна:", error);
  process.exit(1);
});
