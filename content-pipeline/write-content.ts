/**
 * Stage 3 of the content pipeline: write live POI texts via Claude.
 *
 * Reads `content/candidates/<zone>.json`, writes
 * `content/candidates/<zone>.enriched.json` incrementally (resumable —
 * re-runs skip slugs already written).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... pnpm content:write
 *   ANTHROPIC_API_KEY=... pnpm content:write -- some-zone --concurrency 3
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { fetchExtract } from "./lib/wikipedia";
import { MODEL_ID, writeContent, type POIContent } from "./lib/claude";
import { createLimiter } from "./lib/concurrency";
import { getZone } from "./zones";
import type { Candidate } from "./types";

const ROOT = resolve(import.meta.dirname, "..");

type EnrichedCandidate = Candidate & {
  content: POIContent;
  generated_at: string;
  model: string;
};

type EnrichedFile = {
  zone: { slug: string; title: string };
  generated_at: string;
  model: string;
  candidates: EnrichedCandidate[];
  failed?: Array<{ slug: string; error: string }>;
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const zone = getZone(args.zone);

  const inPath = resolve(ROOT, "content", "candidates", `${zone.slug}.json`);
  const outPath = resolve(
    ROOT,
    "content",
    "candidates",
    `${zone.slug}.enriched.json`,
  );

  console.log(`📍 Зона: ${zone.title}`);
  console.log(`   in:  ${inPath}`);
  console.log(`   out: ${outPath}`);

  const candidates = await readCandidates(inPath);
  console.log(`   кандидатов: ${candidates.length}`);

  const enriched = await loadOrInitEnriched(outPath, zone);
  const writtenSlugs = new Set(enriched.candidates.map((c) => c.slug));
  const failedSlugs = new Set((enriched.failed ?? []).map((f) => f.slug));
  const todo = candidates.filter(
    (c) => !writtenSlugs.has(c.slug) && !failedSlugs.has(c.slug),
  );
  console.log(`   уже написано: ${writtenSlugs.size}`);
  console.log(`   ранее упало:  ${failedSlugs.size}`);
  console.log(`   к работе:     ${todo.length}\n`);

  if (todo.length === 0) {
    console.log("✓ Всё уже написано. Чтобы переписать — удалите enriched.json или конкретные записи в нём.");
    return;
  }

  const limit = createLimiter(args.concurrency);
  const totals = {
    cache_creation: 0,
    cache_read: 0,
    input: 0,
    output: 0,
  };

  let done = 0;
  await Promise.all(
    todo.map((candidate) =>
      limit(async () => {
        const idx = ++done;
        const tag = `[${idx}/${todo.length}] ${candidate.name_ru}`;
        try {
          console.log(`${tag} → fetching wiki...`);
          const [wpRu, wpEn] = await Promise.all([
            candidate.sources.wikipedia?.lang === "ru"
              ? fetchExtract({
                  lang: "ru",
                  title: candidate.sources.wikipedia.title,
                })
              : undefined,
            candidate.sources.wikipedia?.lang === "en"
              ? fetchExtract({
                  lang: "en",
                  title: candidate.sources.wikipedia.title,
                })
              : undefined,
          ]);

          console.log(`${tag} → asking Claude...`);
          const { content, usage } = await writeContent({
            candidate,
            wikipediaRu: wpRu,
            wikipediaEn: wpEn,
          });

          totals.cache_creation += usage.cache_creation_input_tokens ?? 0;
          totals.cache_read += usage.cache_read_input_tokens ?? 0;
          totals.input += usage.input_tokens;
          totals.output += usage.output_tokens;

          enriched.candidates.push({
            ...candidate,
            content,
            generated_at: new Date().toISOString(),
            model: MODEL_ID,
          });
          // Save after each completion — restart-safe.
          await persist(outPath, enriched);
          console.log(
            `${tag} ✓ confidence=${content.confidence} (in=${usage.input_tokens} cache_read=${usage.cache_read_input_tokens ?? 0} out=${usage.output_tokens})`,
          );
        } catch (error) {
          const message = errorMessage(error);
          (enriched.failed ??= []).push({ slug: candidate.slug, error: message });
          await persist(outPath, enriched);
          console.error(`${tag} ✗ ${message}`);
        }
      }),
    ),
  );

  const succeeded = enriched.candidates.length - writtenSlugs.size;
  const failed = (enriched.failed?.length ?? 0) - failedSlugs.size;

  console.log(`\nИТОГО за этот запуск:`);
  console.log(`  написано: ${succeeded}`);
  console.log(`  упало:    ${failed}`);
  console.log(`\nТокены:`);
  console.log(`  input (новые):     ${totals.input}`);
  console.log(`  cache write:       ${totals.cache_creation}`);
  console.log(`  cache read:        ${totals.cache_read}  (≈90% скидка)`);
  console.log(`  output:            ${totals.output}`);
  const cost = estimateCost(totals);
  console.log(`  ≈ стоимость:       $${cost.toFixed(3)}`);
  console.log(`\nДальше: проверить ${outPath}, доделать упавшие или импортировать в Supabase.`);
}

function parseArgs(argv: string[]): { zone: string; concurrency: number } {
  let zone = "chistye-prudy";
  let concurrency = 3;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--concurrency" || arg === "-c") {
      concurrency = Math.max(1, Math.min(10, Number(argv[++i] ?? "3")));
    } else if (!arg.startsWith("-")) {
      zone = arg;
    }
  }
  return { zone, concurrency };
}

async function readCandidates(path: string): Promise<Candidate[]> {
  if (!existsSync(path)) {
    throw new Error(
      `Не найден ${path}. Сначала запустите pnpm content:fetch`,
    );
  }
  const raw = JSON.parse(await readFile(path, "utf-8")) as {
    candidates: Candidate[];
  };
  return raw.candidates;
}

async function loadOrInitEnriched(
  path: string,
  zone: { slug: string; title: string },
): Promise<EnrichedFile> {
  if (existsSync(path)) {
    return JSON.parse(await readFile(path, "utf-8")) as EnrichedFile;
  }
  return {
    zone: { slug: zone.slug, title: zone.title },
    generated_at: new Date().toISOString(),
    model: MODEL_ID,
    candidates: [],
  };
}

async function persist(path: string, data: EnrichedFile): Promise<void> {
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2));
}

function errorMessage(error: unknown): string {
  if (error instanceof Anthropic.APIError) {
    return `${error.status} ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

function estimateCost(totals: {
  cache_creation: number;
  cache_read: number;
  input: number;
  output: number;
}): number {
  // Opus 4.7 pricing per the claude-api skill:
  // Input $5/1M, Output $25/1M. Cache write ~1.25× input, cache read ~0.1× input.
  const IN = 5 / 1_000_000;
  const OUT = 25 / 1_000_000;
  return (
    totals.input * IN +
    totals.cache_creation * (IN * 1.25) +
    totals.cache_read * (IN * 0.1) +
    totals.output * OUT
  );
}

main().catch((error) => {
  console.error("\n✗ Ошибка пайплайна:", error);
  process.exit(1);
});
