# Гуляка

PWA для прогулок по Москве: маршруты, клик по зданию → живой рассказ о его истории.

Стартовая зона — **Чистые пруды**, расширяемся волнами от этой точки.

## Стек

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first config через `@theme`)
- **MapLibre GL** + **OpenFreeMap** (бесплатные векторные карты)
- **Serwist** для PWA / service worker
- **Supabase** (Postgres + PostGIS + Auth + Storage)

## Запуск

```bash
pnpm install
cp .env.example .env.local   # заполнить ключи Supabase
pnpm dev
```

Открыть http://localhost:3000

Для применения схемы БД — см. [`supabase/README.md`](./supabase/README.md).
Для сбора POI-кандидатов — см. [`content-pipeline/README.md`](./content-pipeline/README.md).

## Команды

```bash
pnpm dev               # dev-сервер
pnpm build             # production-сборка (генерирует service worker)
pnpm start             # production-сборка → запуск
pnpm lint              # ESLint
pnpm format            # Prettier

pnpm content:fetch     # собрать кандидатов POI для зоны (по умолчанию: chistye-prudy)
pnpm content:preview   # сгенерировать markdown превью с фото
pnpm content:write     # написать живые тексты через Claude (нужен ANTHROPIC_API_KEY)
pnpm content:import    # загрузить enriched.json в Supabase (нужен SUPABASE_SERVICE_ROLE_KEY)
```

## Структура

```
src/
  app/                 # Next.js App Router
    layout.tsx         # шрифты, метаданные, PWA
    page.tsx           # главный экран с картой и user menu
    login/             # страница входа (magic link)
    auth/
      callback/        # обмен code → session
      sign-out/        # action выхода
    sw.ts              # service worker (Serwist)
    globals.css        # Tailwind + brand palette
  proxy.ts             # рефреш сессии Supabase (Next 16: бывший middleware)
  components/
    map/               # MapLibre обёртка
    auth/              # user menu
    ui/                # button/input/label
    sw-register.tsx
  lib/
    constants.ts       # координаты пилотной зоны, URL стиля карты
    utils.ts           # cn helper
    supabase/
      client.ts        # клиент для Client Components
      server.ts        # клиент для Server Components / Actions
      types.ts         # хэнд-врайтн Database типы
content-pipeline/      # сбор POI из Overpass + Wikidata + Commons
  fetch-candidates.ts  # Stage 1: загрузка и фильтрация
  render-preview.ts    # Stage 2: markdown с фото для review
  lib/                 # API-обёртки и утилиты
content/
  candidates/          # output: <zone>.json и <zone>.md
public/
  manifest.webmanifest, icon*.png, icon.svg
supabase/
  migrations/          # SQL-миграции (применять вручную в дашборде)
  README.md            # инструкции по применению
scripts/
  generate-icons.mjs
```

## Дорожная карта

- [x] **Phase 0** — каркас, карта, PWA-манифест
- [x] **Phase 1.1** — Supabase: схема БД (PostGIS), клиенты, типы, RPC
- [x] **Phase 1.2** — auth UI (magic link, callback, user menu, sign-out)
- [x] **Phase 2.1** — content-pipeline: сборщик кандидатов POI (Overpass + Wikidata + Commons), markdown-превью
- [x] **Phase 2.2** — генерация живых текстов через Claude API (Opus 4.7, structured outputs, prompt caching)
- [x] **Phase 2.3** — импорт enriched JSON в Supabase через RPC `upsert_poi`
- [ ] **Phase 3** — POI на карте, карточка POI с фото и текстом
- [ ] **Phase 4** — готовые маршруты, фильтры по темам
- [ ] **Phase 5** — геолокация, «Я здесь», push при подходе к POI
- [ ] **Phase 6** — избранное, история, гейминфикация
- [ ] **Phase 7** — полировка, A11y, расширение зон покрытия
- [ ] **v2** — аудиогид (отложено)

## Контент-пайплайн (общая идея)

Каждый POI = здание/мост/памятник + краткий и развёрнутый текст + 2–3 факт-карточки + **фото обязательно** (без фото POI не публикуется).

1. **Stage 1 (fetch)** — `pnpm content:fetch` собирает кандидатов через Overpass + Wikidata + Commons.
2. **Stage 2 (preview)** — `pnpm content:preview` рендерит markdown с фото для проверки на телефоне.
3. **Stage 3 (write)** — `pnpm content:write` пишет живые тексты через Claude (Opus 4.7) по жёсткому шаблону на основе Wikipedia + Wikidata.
4. **Stage 4 (import)** — публикация в Supabase через `/admin` или скриптом.

Подробности — в [`content-pipeline/README.md`](./content-pipeline/README.md).
