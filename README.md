# Гуляка

PWA для прогулок по Москве: маршруты, клик по зданию → живой рассказ о его истории.

Стартовая зона — **Чистые пруды**, расширяемся волнами от этой точки.

## Стек

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first config через `@theme`)
- **MapLibre GL** + **OpenFreeMap** (бесплатные векторные карты)
- **Serwist** для PWA / service worker
- **Supabase** для БД, авторизации и хранилища (подключим в Phase 1)

## Запуск

```bash
pnpm install
pnpm dev
```

Открыть http://localhost:3000

## Команды

```bash
pnpm dev      # dev-сервер
pnpm build    # production-сборка (генерирует service worker)
pnpm start    # запуск production-сборки
pnpm lint     # ESLint
```

## Структура

```
src/
  app/             # Next.js App Router
    layout.tsx     # корневой layout, шрифты, метаданные, PWA
    page.tsx       # главный экран с картой
    sw.ts          # service worker (Serwist)
    globals.css    # Tailwind + brand palette
  components/
    map/           # MapLibre обёртка
    sw-register.tsx
  lib/
    constants.ts   # координаты пилотной зоны, URL стиля карты
    utils.ts       # cn helper
public/
  manifest.webmanifest
  icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png
scripts/
  generate-icons.mjs  # сборка PNG-иконок из SVG
```

## Дорожная карта

- [x] **Phase 0** — каркас, карта, PWA-манифест
- [ ] **Phase 1** — Supabase, схема БД, auth-экран
- [ ] **Phase 2** — сбор кандидатов POI (Overpass + Wikidata) для пилотной зоны
- [ ] **Phase 3** — POI с историями на карте, карточка POI, фото
- [ ] **Phase 4** — готовые маршруты, фильтры по темам
- [ ] **Phase 5** — геолокация, «Я здесь», push при подходе к POI
- [ ] **Phase 6** — аккаунты, избранное, история, гейминфикация
- [ ] **Phase 7** — полировка, A11y, расширение зон покрытия
- [ ] **v2** — аудиогид (отложено)

## Контент-пайплайн (план)

Каждый POI = здание/мост/памятник + краткий и развёрнутый текст + 2–3 факт-карточки + **фото обязательно** (без фото POI не публикуется).

1. Скрипт собирает кандидатов через **Overpass API** (OSM) + **Wikidata SPARQL** в bbox пилотной зоны.
2. Тексты пишутся через под-агентов Claude по фиксированному шаблону на основе Wikipedia + Wikidata.
3. Фотографии — из Wikimedia Commons (или ручной загрузкой в Supabase Storage).
4. Редактура и публикация — через `/admin`.
