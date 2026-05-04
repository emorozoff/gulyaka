/**
 * Stage 1.5 of the content pipeline.
 *
 * Reads `content/candidates/<zone>.json` and renders a phone-friendly markdown
 * preview that GitHub displays nicely on mobile. Use this to scroll through
 * candidates and decide which to keep / drop / merge before content writing.
 *
 * Usage:
 *   pnpm content:preview                # default zone: chistye-prudy
 *   pnpm content:preview -- some-other
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getZone } from "./zones";
import type { Candidate } from "./types";

const ROOT = resolve(import.meta.dirname, "..");

const TYPE_LABELS: Record<Candidate["type"], string> = {
  monument: "Памятник",
  church: "Храм",
  bridge: "Мост",
  mansion: "Особняк",
  soviet: "Советский период",
  modernism: "Модерн / современная архитектура",
  building: "Здание",
  park: "Парк",
  other: "Другое",
};

async function main() {
  const zoneSlug = process.argv[2] ?? "chistye-prudy";
  const zone = getZone(zoneSlug);

  const inPath = resolve(ROOT, "content", "candidates", `${zone.slug}.json`);
  const raw = await readFile(inPath, "utf-8");
  const data = JSON.parse(raw) as { zone: typeof zone; candidates: Candidate[]; generated_at: string };

  const grouped = new Map<Candidate["type"], Candidate[]>();
  for (const c of data.candidates) {
    const list = grouped.get(c.type) ?? [];
    list.push(c);
    grouped.set(c.type, list);
  }

  const lines: string[] = [
    `# Кандидаты POI: ${zone.title}`,
    "",
    `**Всего:** ${data.candidates.length}  ·  **Сгенерировано:** ${data.generated_at}`,
    "",
    zone.notes ? `> ${zone.notes}` : "",
    "",
    "Для каждого кандидата внизу: фото из Wikimedia Commons, базовые факты, ссылки на источники. Скролльте, отмечайте на полях ✗ для пропуска или ★ для приоритета. Тексты будем писать на следующем шаге.",
    "",
    "---",
    "",
  ].filter(Boolean);

  for (const [type, items] of grouped) {
    lines.push(`## ${TYPE_LABELS[type]} (${items.length})`, "");
    for (const c of items) {
      lines.push(...renderCandidate(c));
    }
  }

  const outPath = resolve(ROOT, "content", "candidates", `${zone.slug}.md`);
  await writeFile(outPath, lines.join("\n"));
  console.log(`✓ Записано: ${outPath}`);
}

function renderCandidate(c: Candidate): string[] {
  const lines: string[] = [];
  lines.push(`### ${c.name_ru}`);
  if (c.name_en && c.name_en !== c.name_ru) lines.push(`*${c.name_en}*`);
  lines.push("");
  lines.push(`<img src="${c.image.thumb_url}" alt="${escapeHtml(c.name_ru)}" width="400">`);
  lines.push("");

  const facts: string[] = [];
  if (c.built_year) facts.push(`**Год:** ${c.built_year}`);
  if (c.architect) facts.push(`**Архитектор:** ${c.architect}`);
  if (c.address) facts.push(`**Адрес:** ${c.address}`);
  facts.push(`**Координаты:** ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`);
  if (c.description) facts.push(`**Описание (Wiki):** ${c.description}`);
  for (const fact of facts) lines.push(`- ${fact}`);
  lines.push("");

  const links: string[] = [];
  if (c.sources.wikipedia) links.push(`[Wikipedia](${c.sources.wikipedia.url})`);
  if (c.sources.wikidata) links.push(`[Wikidata](${c.sources.wikidata.url})`);
  if (c.sources.osm) links.push(`[OSM](${c.sources.osm.url})`);
  if (links.length) lines.push(links.join(" · "));

  lines.push("", "---", "");
  return lines;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

main().catch((error) => {
  console.error("\n✗ Ошибка рендера:", error);
  process.exit(1);
});
