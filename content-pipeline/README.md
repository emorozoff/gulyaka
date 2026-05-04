# Content pipeline

Сбор и подготовка POI-кандидатов для приложения. Запускается локально (нужен интернет к Overpass API, Wikidata, Wikimedia Commons и Anthropic API).

## Этапы

```
[1] fetch       OSM + Wikidata + Commons  →  content/candidates/<zone>.json
[2] preview     candidates.json           →  content/candidates/<zone>.md
[3] write       Claude (Opus 4.7)          →  content/candidates/<zone>.enriched.json
[4] import      enriched.json             →  Supabase (через Stage 4 скрипт)
```

Реализованы **Stage 1, 2 и 3**. Stage 4 — следующая итерация.

## Зоны

Зоны определены в `content-pipeline/zones.ts`. Каждая зона — это:
- `slug` — короткое имя (используется в путях файлов)
- `title` — человекочитаемое название
- `sw`, `ne` — углы bounding box (lat, lng)

Сейчас активна одна зона: `chistye-prudy`. По мере расширения добавляем новые волны.

## Запуск

Из корня репо:

```bash
# 1. Сбор кандидатов из Overpass + Wikidata + Commons
pnpm content:fetch

# 2. Рендер markdown-превью (с картинками — открывайте на GitHub mobile)
pnpm content:preview

# 3. Написание живых текстов через Claude
ANTHROPIC_API_KEY=sk-ant-... pnpm content:write
# или с настройкой параллелизма (по умолчанию 3)
pnpm content:write -- chistye-prudy --concurrency 4

# Для другой зоны
pnpm content:fetch some-other-zone
pnpm content:preview some-other-zone
pnpm content:write some-other-zone
```

`content:fetch` занимает 10-30 секунд (Overpass + Wikidata; есть фолбэк на 3 зеркала Overpass).
`content:write` — несколько минут на 30-50 кандидатов. Сохраняет прогресс после каждого POI: можно прервать `Ctrl+C` и продолжить — повторный запуск пропускает уже написанные slug'и.

## Что попадает в кандидаты

Запрос в Overpass собирает все ноды/вэи/реляции в bbox с одним из тегов:
- `wikidata=*`
- `heritage=*`
- `historic=monument|memorial|building|church|chapel|mansion|manor|castle|tomb|ruins|archaeological_site`
- `tourism=attraction|artwork`
- `man_made=bridge` или `bridge=*`

После — обогащение из Wikidata: фото (P18), год основания (P571), архитектор (P84), ссылки на Википедию.

Кандидат **попадает в финальный JSON только если есть фото** (требование продукта). Без фото — отбрасывается, в логе показывается счётчик.

## Структура `candidates/<zone>.json`

```jsonc
{
  "zone": { "slug": "...", "title": "...", "sw": [...], "ne": [...] },
  "generated_at": "2026-...",
  "candidates": [
    {
      "slug": "khram-troitsy-na-gryazyakh-...",
      "name_ru": "...",
      "name_en": "...",
      "type": "church",
      "address": "...",
      "lat": 55.764, "lng": 37.642,
      "built_year": 1861,
      "architect": "...",
      "image": {
        "filename": "...jpg",
        "url": "https://commons.wikimedia.org/wiki/Special:FilePath/...",
        "thumb_url": "...?width=800"
      },
      "sources": {
        "osm": { "type": "way", "id": 1234, "url": "..." },
        "wikidata": { "id": "Q...", "url": "..." },
        "wikipedia": { "lang": "ru", "title": "...", "url": "..." }
      },
      "osm_tags": { ... }
    }
  ]
}
```

## Workflow рецензента

1. Запустить `pnpm content:fetch` → проверить количество кандидатов в логе.
2. Запустить `pnpm content:preview` → открыть `.md` файл (на телефоне через GitHub) и пролистать.
3. Удалить лишние записи руками в `<zone>.json` (или сделать `<zone>.curated.json` и редактировать `write-content.ts` чтобы он читал curated).
4. Запустить `pnpm content:write` → посмотреть `confidence` каждой записи и `notes_for_editor` в `<zone>.enriched.json`.
5. Отредактировать тексты, где нужно — JSON удобно править руками.

## Stage 3 — написание текстов

Что делает скрипт:
1. Читает `content/candidates/<zone>.json`.
2. Для каждого POI догружает Wikipedia extract (RU + EN) через Action API — до ~5 KB plain text.
3. Шлёт в Claude (модель `claude-opus-4-7`, adaptive thinking, effort=high) запрос с:
   - System prompt с жёстким style guide (живой голос, без клише, конкретные детали) — **кэшируется** через `cache_control: ephemeral`, повторные запросы используют ~10% стоимости system prompt.
   - User message с собранными данными для конкретного POI.
   - Structured output через Zod-схему: `short_blurb`, `long_text`, `fact_cards`, `confidence`, `notes_for_editor`.
4. Сохраняет результат в `<zone>.enriched.json` после каждого POI.
5. Падает gracefully: если один POI не получился — записывает в `failed[]` и продолжает.

### Стоимость

Опус 4.7: input $5/1M, output $25/1M. Из-за prompt caching system prompt оплачивается полностью только на первом POI, дальше идёт по скидке.

Грубая оценка: ~$0.05–0.10 на POI. Для 50 POI ≈ $3–5. Скрипт печатает фактическую стоимость в конце запуска.

### Resume

`<zone>.enriched.json` сохраняется после каждого успешного POI. Если прервать (Ctrl+C, лимит API, что угодно) — следующий запуск пропустит написанные. Чтобы переписать конкретный POI — удалить его из `candidates[]` в enriched.json. Чтобы перезапустить упавший — удалить из `failed[]`.

## Лимиты и вежливость

- Overpass: один POST на зону, ~25-60 сек таймаут. Скрипт пробует три зеркала по очереди при ошибке.
- Wikidata: пакетные запросы по 50 QID, между батчами 200 мс паузы.
- Wikimedia Commons: только URL-конструкция через `Special:FilePath`, без API-вызовов.
- Wikipedia: один запрос на POI (RU + EN параллельно), плейн-текст extract до 5 KB.
- Anthropic API: 3 параллельных запроса по умолчанию (`--concurrency`), официальный SDK с автоматическими ретраями rate-limit ошибок.

User-Agent у всех публичных API: `Gulyaka/0.1 (content pipeline; <repo URL>)`. Этого достаточно для free-tier политик.
