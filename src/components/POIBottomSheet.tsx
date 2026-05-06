import { useEffect } from 'react';
import type { POI } from '../data/types';

type Props = {
  poi: POI | null;
  index: number;
  total: number;
  onClose: () => void;
};

export function POIBottomSheet({ poi, index, total, onClose }: Props) {
  useEffect(() => {
    if (!poi) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [poi, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-[1000] transition-opacity duration-200 ${
          poi ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed inset-x-0 bottom-0 z-[1001] bg-white rounded-t-2xl shadow-2xl max-h-[85vh] pb-safe flex flex-col transform transition-transform duration-300 ease-out ${
          poi ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-label={poi?.title}
      >
        <button
          type="button"
          className="block w-full pt-1 pb-1"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <span className="sheet-handle block" />
        </button>
        <header className="px-5 pb-4 border-b border-stone-100">
          <p className="text-xs uppercase tracking-[0.15em] text-stone-500">
            Точка {index} из {total}
            {poi?.tag ? ` · ${poi.tag}` : ''}
          </p>
          <h2 className="text-xl font-semibold leading-tight mt-1">
            {poi?.title}
          </h2>
        </header>
        {poi && (
          <div className="overflow-y-auto px-5 py-4 space-y-5">
            {poi.photo && (
              <figure className="-mx-5">
                <img
                  src={poi.photo.url}
                  alt={poi.photo.caption ?? poi.title}
                  className="w-full aspect-[4/3] object-cover bg-stone-100"
                  loading="lazy"
                />
                <figcaption className="px-5 pt-2 text-xs text-stone-500 leading-snug">
                  {poi.photo.caption}
                  {poi.photo.caption ? ' · ' : ''}
                  {poi.photo.attributionUrl ? (
                    <a
                      className="underline"
                      href={poi.photo.attributionUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {poi.photo.attribution}
                    </a>
                  ) : (
                    poi.photo.attribution
                  )}
                </figcaption>
              </figure>
            )}
            <div className="space-y-3 leading-relaxed text-stone-800">
              {poi.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {poi.facts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-[0.15em] text-stone-500">
                  Знаете ли вы
                </h3>
                <ul className="space-y-2">
                  {poi.facts.map((f, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-stone-200 p-4 bg-stone-50"
                    >
                      <p className="font-medium leading-snug">{f.title}</p>
                      <p className="text-stone-700 text-sm mt-1 leading-relaxed">
                        {f.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
