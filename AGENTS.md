# Гуляка

PWA с пешеходными маршрутами по Москве. Каждая точка маршрута — здание или место с
живым рассказом и парой фактов.

## Стек

- Vite + React + TypeScript
- Tailwind CSS v4 (через `@tailwindcss/vite`, без `tailwind.config`)
- Leaflet + react-leaflet + тайлы OpenStreetMap
- vite-plugin-pwa (Workbox: precache app shell, runtime cache для тайлов и фото)
- Деплой: GitHub Actions → ветка `gh-pages` → GitHub Pages

## Скрипты

- `pnpm dev` — dev-сервер
- `pnpm build` — typecheck + production build в `dist/`
- `pnpm preview` — превью production-сборки
- `pnpm typecheck` — только TypeScript

## Структура

- `src/data/` — типы и данные маршрутов (POI с координатами, текстом, фото)
- `src/screens/` — экраны (Home, Map)
- `src/components/` — переиспользуемые UI-компоненты (карта, bottom sheet, маркеры)
- `src/hooks/` — React-хуки (например, геолокация)
- `public/icons/` — иконки PWA

## Маршруты

Маршрут — статичный объект в `src/data/routes/*.ts`. Никакой БД и админки нет:
правишь данные руками, коммитишь, пуш → автоматический деплой.
