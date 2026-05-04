# Content pipeline

Сбор и подготовка POI-кандидатов для приложения. Запускается локально (нужен интернет к Overpass API, Wikidata и Wikimedia Commons).

## Этапы

```
[1] fetch       OSM + Wikidata + Commons  →  content/candidates/<zone>.json
[2] preview     candidates.json           →  content/candidates/<zone>.md
[3] write       (sub-агенты Claude)       →  content/candidates/<zone>.enriched.json
[4] import      enriched.json             →  Supabase (через Stage 4 скрипт)
```

Сейчас реализованы **Stage 1 и 2**. Stage 3 запускается отдельно через Claude. Stage 4 будет добавлен после Stage 3.

## Зоны

Зоны определены в `content-pipeline/zones.ts`. Каждая зона — это:
- `slug` — короткое имя (используется в путях файлов)
- `title` — человекочитаемое название
- `sw`, `ne` — углы bounding box (lat, lng)

Сейчас активна одна зона: `chistye-prudy`. По мере расширения добавляем новые волны.

## Запуск

Из корня репо:

```bash
# Сбор кандидатов из Overpass + Wikidata + Commons
pnpm content:fetch

# Рендер markdown-превью (с картинками — открывайте на GitHub mobile)
pnpm content:preview

# Для другой зоны
pnpm content:fetch some-other-zone
pnpm content:preview some-other-zone
```

`content:fetch` обычно занимает 10-30 секунд (один POST в Overpass + 1-2 пакетных запроса в Wikidata). Если Overpass лежит, скрипт перебирает зеркала.

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
3. Перенести/удалить лишние записи руками в JSON или в отдельном файле `content/candidates/<zone>.curated.json`.
4. Передать curated.json в Stage 3 (написание текстов).

## Лимиты и вежливость

- Overpass: один POST на зону, ~25-60 сек таймаут. Скрипт пробует три зеркала по очереди при ошибке.
- Wikidata: пакетные запросы по 50 QID, между батчами 200 мс паузы.
- Wikimedia Commons: только URL-конструкция через `Special:FilePath`, без API-вызовов.

User-Agent у всех запросов: `Gulyaka/0.1 (content pipeline; <repo URL>)`. Этого достаточно для соблюдения политик free-tier.
