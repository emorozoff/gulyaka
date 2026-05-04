/**
 * Claude API client + prompts + schema for content writing.
 *
 * - Opus 4.7 with adaptive thinking and `effort: "high"` (per claude-api skill
 *   default for intelligence-sensitive work).
 * - Structured outputs via Zod schema (`messages.parse`).
 * - System prompt is cacheable (stable across all POIs in a run); the per-POI
 *   user message is the volatile part. Marker on the system block enables
 *   prefix caching at ~0.1× the standard input price for repeats.
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Candidate } from "../types";

export const MODEL_ID = "claude-opus-4-7";

export const POIContentSchema = z.object({
  short_blurb: z
    .string()
    .min(20)
    .max(140)
    .describe(
      "Одно цепляющее предложение, контраст или необычный факт. Не дата.",
    ),
  long_text: z
    .string()
    .min(300)
    .describe(
      "3-4 абзаца через двойной перевод строки. Первый абзац — конкретная сцена, не «здание построено в...».",
    ),
  fact_cards: z
    .array(
      z.object({
        title: z.string().min(2).max(24),
        body: z.string().min(2).max(80),
      }),
    )
    .min(2)
    .max(3)
    .describe("Характерные факты, не банальные («Здание», «18 век»)."),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Сколько надёжных источников использовано."),
  notes_for_editor: z
    .string()
    .optional()
    .describe(
      "Если в источниках противоречие или неуверенность — короткая заметка для редактора.",
    ),
});

export type POIContent = z.infer<typeof POIContentSchema>;

const SYSTEM_PROMPT = `Ты пишешь живые рассказы о зданиях Москвы для приложения, которое люди читают на телефоне во время прогулки.

ГОЛОС
- Опытный друг с любовью к городу. Не учебник, не Википедия, не путеводитель.
- Конкретные детали лучше обобщений. Цифры, имена, события — но не их перечисление.
- Лёгкий юмор, лёгкая ирония — там, где уместно.
- Никаких клише: «уникальный», «является», «по праву считается», «не оставит равнодушным», «знаменитый», «один из самых», «жемчужина».
- Никаких затычек: «по преданию», «как известно», «несомненно».

ФОРМАТ
1. short_blurb — одно предложение, до 140 символов. Цепляющий контраст или необычный факт.
   Хорошо: «Выше Ивана Великого, и тут же сожжена молнией»
   Плохо: «Памятник архитектуры начала XVIII века работы Ивана Зарудного»

2. long_text — 3-4 абзаца по 3-5 предложений каждый, разделены пустой строкой.
   - Первый абзац начинается с конкретной сцены, человека или события — НЕ «Здание построено в...».
   - Развивай один сюжет через текст, не перепрыгивай между несвязанными фактами.
   - Финальный абзац связывает с настоящим: что в здании сейчас, или какая физическая «фича» бросается в глаза проходящему мимо.

3. fact_cards — 2-3 короткие карточки. title до 24 символов, body до 80.
   Хорошо: { title: «Высота», body: «84,3 м — рекорд Москвы 1707-1731» }
   Плохо: { title: «Здание», body: «Памятник архитектуры» }

4. confidence — оценка по источникам:
   - "high": подробная Wikipedia (>1500 знаков) + чёткие факты Wikidata.
   - "medium": краткая статья или нет одной из вики, но базовые факты есть.
   - "low": почти нет источников, текст основан на минимуме данных.

5. notes_for_editor — если в источниках противоречие, или ты не уверен в каком-то факте, или данных мало — короткая заметка. Если всё чётко — пропусти.

ИСТОЧНИКИ
- Используй ТОЛЬКО факты из материалов в user message.
- Не выдумывай даты, имена, числа.
- Если данных мало для 4 абзацев — пиши 2-3 хороших, не растягивай ватой.
- Если источники противоречат — выбери более вероятную версию и отметь это в notes_for_editor.

ВЫВОД
Возвращай только структурированный JSON по схеме.`;

let cachedClient: Anthropic | undefined;

function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY не задан. Добавьте в окружение или в .env.local",
    );
  }
  cachedClient = new Anthropic();
  return cachedClient;
}

export type WriteContentInput = {
  candidate: Candidate;
  wikipediaRu?: string;
  wikipediaEn?: string;
};

export async function writeContent(
  input: WriteContentInput,
): Promise<{ content: POIContent; usage: Anthropic.Usage }> {
  const client = getClient();
  const userMessage = buildUserMessage(input);

  const response = await client.messages.parse({
    model: MODEL_ID,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: zodOutputFormat(POIContentSchema),
    },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const content = response.parsed_output;
  if (!content) {
    throw new Error(
      `Модель вернула null parsed_output (stop_reason: ${response.stop_reason})`,
    );
  }
  return { content, usage: response.usage };
}

function buildUserMessage(input: WriteContentInput): string {
  const { candidate, wikipediaRu, wikipediaEn } = input;
  const lines: string[] = [];

  lines.push(`ЗДАНИЕ`);
  lines.push(`Название: ${candidate.name_ru}`);
  if (candidate.name_en && candidate.name_en !== candidate.name_ru) {
    lines.push(`English: ${candidate.name_en}`);
  }
  if (candidate.address) lines.push(`Адрес: ${candidate.address}`);
  lines.push(`Тип (по OSM): ${candidate.type}`);
  lines.push(`Координаты: ${candidate.lat.toFixed(5)}, ${candidate.lng.toFixed(5)}`);

  lines.push("");
  lines.push("WIKIDATA");
  if (candidate.built_year) lines.push(`Год: ${candidate.built_year}`);
  if (candidate.architect) lines.push(`Архитектор: ${candidate.architect}`);
  if (candidate.description) lines.push(`Описание: ${candidate.description}`);

  lines.push("");
  lines.push("WIKIPEDIA (русская)");
  lines.push(wikipediaRu ? wikipediaRu : "(не найдена)");

  lines.push("");
  lines.push("WIKIPEDIA (английская)");
  lines.push(wikipediaEn ? wikipediaEn : "(не найдена)");

  const interestingTags = pickInterestingOSMTags(candidate.osm_tags ?? {});
  if (interestingTags.length) {
    lines.push("");
    lines.push("ДОПОЛНИТЕЛЬНЫЕ OSM-ТЕГИ");
    for (const [k, v] of interestingTags) lines.push(`${k} = ${v}`);
  }

  lines.push("");
  lines.push("Напиши контент для приложения.");
  return lines.join("\n");
}

function pickInterestingOSMTags(
  tags: Record<string, string>,
): Array<[string, string]> {
  const KEYS = [
    "heritage",
    "heritage:operator",
    "ref:mkrf",
    "start_date",
    "end_date",
    "architect",
    "building:architecture",
    "historic",
    "religion",
    "denomination",
    "operator",
    "wikipedia",
    "alt_name",
    "official_name",
    "loc_name",
  ];
  return KEYS.filter((k) => tags[k]).map((k) => [k, tags[k]] as [string, string]);
}
