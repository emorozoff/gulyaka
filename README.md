# Гуляка

Демка PWA для прогулок по Москве: карта Чистых прудов с 6 точками, по тапу — карточка с историей здания.

## Стек

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- MapLibre GL + OpenFreeMap (бесплатные векторные карты, без ключа)

POI зашиты прямо в код (`src/lib/mock-pois.ts`). Никакой БД, никакого auth.

## Запуск

```bash
pnpm install
pnpm dev
```

→ http://localhost:3000

## Деплой

Статичный сайт, prerender. Подходит для Vercel / Netlify / Cloudflare Pages в один клик через GitHub-импорт.
