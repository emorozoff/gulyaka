import { Suspense } from "react";
import { Map } from "@/components/map/map";
import { UserMenu } from "@/components/auth/user-menu";
import { APP_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <main className="relative flex-1 w-full">
      <Map className="absolute inset-0" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="pointer-events-auto rounded-2xl bg-bg/85 px-4 py-2 shadow-sm ring-1 ring-border backdrop-blur">
          <span className="font-serif text-lg leading-none tracking-tight">
            {APP_NAME}
          </span>
          <span className="ml-2 text-xs text-muted-fg">
            Чистые пруды · пилот
          </span>
        </div>

        <Suspense fallback={null}>
          <UserMenu />
        </Suspense>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-bg/90 p-4 shadow-sm ring-1 ring-border backdrop-blur">
          <p className="font-serif text-sm leading-relaxed text-muted-fg">
            Здесь скоро появятся истории зданий. Нажмите на любое здание, чтобы
            узнать о нём — живо и без скучных дат.
          </p>
        </div>
      </div>
    </main>
  );
}
