import { useState } from 'react';
import { routes } from '../data/routes';

export function HomeScreen() {
  const route = routes[0];
  const [coverOk, setCoverOk] = useState(true);

  return (
    <div className="min-h-full max-w-xl mx-auto pb-12">
      <header className="px-6 pt-12 pb-6">
        <p className="text-xs text-stone-500 tracking-[0.2em] uppercase">Гуляка</p>
        <h1 className="text-3xl font-semibold mt-3 leading-[1.15]">
          Прогулки по Москве
          <br />
          с историями про здания
        </h1>
        <p className="text-stone-600 mt-3">
          Один маршрут, несколько точек — на каждой живой рассказ и пара неожиданных
          фактов.
        </p>
      </header>

      <section className="px-6">
        <article className="rounded-2xl overflow-hidden border border-stone-200 bg-white">
          {route.cover && coverOk ? (
            <figure className="aspect-[4/3] bg-stone-100">
              <img
                src={route.cover.url}
                alt={route.cover.caption ?? route.title}
                className="w-full h-full object-cover"
                loading="eager"
                onError={() => setCoverOk(false)}
              />
            </figure>
          ) : (
            <div className="aspect-[4/3] bg-gradient-to-br from-stone-300 via-stone-200 to-stone-100" />
          )}
          <div className="p-5">
            <h2 className="text-xl font-semibold leading-tight">{route.title}</h2>
            {route.subtitle && (
              <p className="text-stone-500 mt-1">{route.subtitle}</p>
            )}
            <div className="flex gap-4 text-sm text-stone-600 mt-4">
              <span>{route.pois.length} точек</span>
              <span>{(route.distanceMeters / 1000).toFixed(1)} км</span>
              <span>≈ {route.durationMinutes} мин</span>
            </div>
            <p className="text-stone-700 mt-4 leading-relaxed">
              {route.description}
            </p>
            {route.startHint && (
              <p className="text-stone-500 text-sm mt-3">
                Начало: {route.startHint}
              </p>
            )}
            <a
              href={`#route/${route.id}`}
              className="block mt-6 text-center bg-stone-900 text-white rounded-xl py-3 font-medium hover:bg-stone-800 transition active:scale-[0.99]"
            >
              Начать прогулку
            </a>
          </div>
        </article>
      </section>

      <footer className="text-center text-xs text-stone-400 mt-12 px-6 leading-relaxed">
        MVP. Пока есть только этот маршрут — будем расширяться по Москве.
      </footer>
    </div>
  );
}
