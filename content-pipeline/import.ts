/**
 * Stage 4 of the content pipeline: import enriched POIs into Supabase.
 *
 * Reads `content/candidates/<zone>.enriched.json` and calls the `upsert_poi`
 * RPC for each row using the service-role key. By default does INSERT ... ON
 * CONFLICT DO NOTHING — re-runs skip rows that already exist (preserves
 * manual edits in Supabase). Use `--overwrite` to replace every field.
 *
 * Usage:
 *   pnpm content:import                              # default zone, draft, no overwrite
 *   pnpm content:import some-zone                    # other zone
 *   pnpm content:import -- --publish                 # set status=published
 *   pnpm content:import -- --overwrite               # clobber existing rows
 *   pnpm content:import -- --slug menshikova-bashnya # only one POI
 *
 * Env vars required:
 *   NEXT_PUBLIC_SUPABASE_URL  (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY (NEVER commit this — service role bypasses RLS)
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getZone } from "./zones";
import type { Candidate } from "./types";

const ROOT = resolve(import.meta.dirname, "..");

type EnrichedCandidate = Candidate & {
  content: {
    short_blurb: string;
    long_text: string;
    fact_cards: Array<{ title: string; body: string }>;
    confidence: "high" | "medium" | "low";
    notes_for_editor?: string;
  };
};

type EnrichedFile = {
  zone: { slug: string; title: string };
  candidates: EnrichedCandidate[];
};

type Args = {
  zone: string;
  overwrite: boolean;
  publish: boolean;
  slugFilter?: string;
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const zone = getZone(args.zone);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      "Не найдены переменные окружения: NEXT_PUBLIC_SUPABASE_URL (или SUPABASE_URL) и SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Скопируйте Service Role Key из Supabase Dashboard → Settings → API.\n" +
        "Положите в .env.local — он подгружается автоматически через --env-file-if-exists.",
    );
    process.exit(1);
  }

  const inPath = resolve(
    ROOT,
    "content",
    "candidates",
    `${zone.slug}.enriched.json`,
  );
  if (!existsSync(inPath)) {
    console.error(
      `Не найден ${inPath}. Сначала запустите pnpm content:write`,
    );
    process.exit(1);
  }

  const data = JSON.parse(await readFile(inPath, "utf-8")) as EnrichedFile;
  let candidates = data.candidates;
  if (args.slugFilter) {
    candidates = candidates.filter((c) => c.slug === args.slugFilter);
    if (candidates.length === 0) {
      console.error(`Не найден slug "${args.slugFilter}" в ${inPath}`);
      process.exit(1);
    }
  }

  console.log(`📍 Зона: ${zone.title}`);
  console.log(`   in:        ${inPath}`);
  console.log(`   to import: ${candidates.length}`);
  console.log(`   режим:     ${args.overwrite ? "OVERWRITE (заменяет)" : "INSERT (пропускает существующие)"}`);
  console.log(`   статус:    ${args.publish ? "published" : "draft"}\n`);

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const status = args.publish ? "published" : "draft";
  const stats = { inserted: 0, skipped: 0, failed: 0 };

  for (const c of candidates) {
    try {
      const { data: insertedId, error } = await supabase.rpc("upsert_poi", {
        in_slug: c.slug,
        in_name: c.name_ru,
        in_lng: c.lng,
        in_lat: c.lat,
        in_type: c.type,
        in_address: c.address ?? null,
        in_built_year: c.built_year ?? null,
        in_architect: c.architect ?? null,
        in_short_blurb: c.content.short_blurb,
        in_long_text: c.content.long_text,
        in_fact_cards: c.content.fact_cards,
        in_cover_image_url: c.image.url,
        in_cover_image_credit: buildImageCredit(c),
        in_sources: buildSources(c),
        in_status: status,
        in_overwrite: args.overwrite,
      });

      if (error) {
        stats.failed++;
        console.error(`✗ ${c.slug}: ${error.message}`);
        continue;
      }

      if (insertedId) {
        stats.inserted++;
        console.log(`✓ ${c.slug}  →  ${insertedId}`);
      } else {
        stats.skipped++;
        console.log(`· ${c.slug}  (уже есть, пропущено)`);
      }
    } catch (err) {
      stats.failed++;
      console.error(`✗ ${c.slug}: ${errorMessage(err)}`);
    }
  }

  console.log(`\nИТОГО:`);
  console.log(`  ${args.overwrite ? "записано" : "вставлено"}: ${stats.inserted}`);
  console.log(`  пропущено: ${stats.skipped}`);
  console.log(`  упало:     ${stats.failed}`);
  if (!args.publish) {
    console.log(`\nСтатус draft. Чтобы опубликовать — Supabase Dashboard → Table Editor → pois → status = published.`);
    console.log(`Или перезапустить с --publish (не забыть про --overwrite если уже импортировано).`);
  }
}

function parseArgs(argv: string[]): Args {
  let zone = "chistye-prudy";
  let overwrite = false;
  let publish = false;
  let slugFilter: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--overwrite") overwrite = true;
    else if (arg === "--publish") publish = true;
    else if (arg === "--slug") slugFilter = argv[++i];
    else if (!arg.startsWith("-")) zone = arg;
  }
  return { zone, overwrite, publish, slugFilter };
}

function buildImageCredit(c: EnrichedCandidate): string {
  // Wikimedia Commons attribution. Ideally we'd fetch the artist + license per
  // image — for now record the source and filename so an editor can fill in
  // the licence string before publication.
  return `Wikimedia Commons: ${c.image.filename}`;
}

function buildSources(c: EnrichedCandidate): Record<string, unknown> {
  const sources: Record<string, unknown> = {};
  if (c.sources.wikidata) sources.wikidata_id = c.sources.wikidata.id;
  if (c.sources.wikipedia) sources.wikipedia_url = c.sources.wikipedia.url;
  if (c.sources.osm) sources.osm_id = `${c.sources.osm.type}/${c.sources.osm.id}`;
  if (c.content.notes_for_editor) {
    sources.notes_for_editor = c.content.notes_for_editor;
  }
  if (c.content.confidence) sources.content_confidence = c.content.confidence;
  return sources;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

main().catch((error) => {
  console.error("\n✗ Ошибка импорта:", error);
  process.exit(1);
});
