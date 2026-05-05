"use client";

import { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";
import type { POI, POIType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<POIType, string> = {
  monument: "Памятник",
  church: "Храм",
  mansion: "Особняк",
  soviet: "Советская архитектура",
  modernism: "Модернизм",
  building: "Здание",
  bridge: "Мост",
  park: "Парк",
  other: "Место",
};

type Props = {
  poi: POI | null;
  onClose: () => void;
};

export function PoiCard({ poi, onClose }: Props) {
  const open = !!poi;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-30 transition-opacity duration-200",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-fg/30 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={poi?.name ?? "Карточка POI"}
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto w-full max-w-xl",
          "max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-bg shadow-2xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full",
          "pb-[max(env(safe-area-inset-bottom),1rem)]",
        )}
      >
        <div className="sticky top-0 z-10 flex justify-center bg-bg pt-3 pb-1">
          <span aria-hidden className="h-1 w-10 rounded-full bg-border" />
        </div>

        {poi ? <PoiContent poi={poi} onClose={onClose} /> : null}
      </div>
    </div>
  );
}

function PoiContent({ poi, onClose }: { poi: POI; onClose: () => void }) {
  return (
    <article className="flex flex-col gap-5 px-5 pb-6">
      <div className="relative -mx-5 aspect-[4/3] overflow-hidden">
        {/* Cover uses an inline SVG data URI in the mock — once Supabase
            Storage is wired up, switch to next/image with remotePatterns. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poi.cover_image_url ?? ""}
          alt={poi.cover_image_credit ?? poi.name}
          className="h-full w-full object-cover"
        />
        <button
          aria-label="Закрыть"
          onClick={onClose}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-bg/85 text-fg shadow-sm ring-1 ring-border backdrop-blur transition-colors hover:bg-bg"
        >
          <X size={18} aria-hidden />
        </button>
        {poi.cover_image_credit ? (
          <span className="absolute bottom-2 left-3 rounded-full bg-fg/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-bg">
            {poi.cover_image_credit}
          </span>
        ) : null}
      </div>

      <header className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-fg">
          {TYPE_LABEL[poi.type]}
          {poi.address ? ` · ${poi.address}` : ""}
        </span>
        <h2 className="font-serif text-2xl leading-tight tracking-tight">
          {poi.name}
        </h2>
        {poi.short_blurb ? (
          <p className="font-serif text-base italic leading-snug text-muted-fg">
            {poi.short_blurb}
          </p>
        ) : null}
      </header>

      {poi.fact_cards.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {poi.fact_cards.map((card, i) => (
            <div key={i} className="rounded-xl bg-muted/70 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-fg">
                {card.title}
              </div>
              <div className="mt-1 text-sm leading-snug">{card.body}</div>
            </div>
          ))}
        </div>
      ) : null}

      {poi.long_text ? (
        <div className="flex flex-col gap-3 font-serif text-[15px] leading-relaxed text-fg">
          {poi.long_text.split(/\n\s*\n/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ) : null}

      <Sources poi={poi} />
    </article>
  );
}

function Sources({ poi }: { poi: POI }) {
  const links: { label: string; url: string }[] = [];
  if (poi.sources.wikipedia_url) {
    links.push({ label: "Wikipedia", url: poi.sources.wikipedia_url });
  }
  if (poi.sources.wikidata_id) {
    links.push({
      label: "Wikidata",
      url: `https://www.wikidata.org/wiki/${poi.sources.wikidata_id}`,
    });
  }
  if (poi.sources.um_mos_url) {
    links.push({ label: "Узнай Москву", url: poi.sources.um_mos_url });
  }
  for (const c of poi.sources.custom ?? []) {
    links.push({ label: c.label, url: c.url });
  }
  if (links.length === 0) return null;

  return (
    <footer className="flex flex-col gap-2 border-t border-border pt-4">
      <span className="text-[10px] uppercase tracking-wider text-muted-fg">
        Источники
      </span>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs text-fg transition-colors hover:bg-muted/60"
          >
            {link.label}
            <ExternalLink size={11} aria-hidden />
          </a>
        ))}
      </div>
    </footer>
  );
}
