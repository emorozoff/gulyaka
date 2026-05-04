-- Гуляка — initial schema
-- Apply via Supabase Dashboard → SQL Editor → New query → paste → Run.

-- ===== Extensions =====
create extension if not exists postgis;

-- ===== Helper: updated_at trigger =====
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===== POIs =====
create table if not exists public.pois (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  address text,
  geom geometry(Point, 4326) not null,
  type text not null check (type in (
    'building','church','mansion','soviet','modernism',
    'monument','bridge','park','other'
  )),
  built_year int,
  architect text,
  short_blurb text,
  long_text text,
  fact_cards jsonb not null default '[]'::jsonb,
  cover_image_url text,
  cover_image_credit text,
  sources jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pois_geom_idx on public.pois using gist (geom);
create index if not exists pois_status_idx on public.pois (status);
create index if not exists pois_type_idx on public.pois (type);

create trigger pois_set_updated_at
  before update on public.pois
  for each row execute function public.set_updated_at();

-- ===== Routes =====
create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  theme text,
  duration_min int,
  distance_m int,
  geom geometry(LineString, 4326),
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists routes_status_idx on public.routes (status);
create index if not exists routes_geom_idx on public.routes using gist (geom);

create trigger routes_set_updated_at
  before update on public.routes
  for each row execute function public.set_updated_at();

-- ===== Route ↔ POI =====
create table if not exists public.route_pois (
  route_id uuid not null references public.routes(id) on delete cascade,
  poi_id uuid not null references public.pois(id) on delete restrict,
  order_index int not null,
  narration_override text,
  primary key (route_id, poi_id)
);

create index if not exists route_pois_order_idx on public.route_pois (route_id, order_index);

-- ===== User: favorites =====
create table if not exists public.user_poi_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  poi_id uuid not null references public.pois(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, poi_id)
);

create table if not exists public.user_route_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  route_id uuid not null references public.routes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, route_id)
);

-- ===== User: visits =====
create table if not exists public.user_poi_visits (
  user_id uuid not null references auth.users(id) on delete cascade,
  poi_id uuid not null references public.pois(id) on delete cascade,
  first_visited_at timestamptz not null default now(),
  last_visited_at timestamptz not null default now(),
  visit_count int not null default 1 check (visit_count >= 1),
  primary key (user_id, poi_id)
);

-- ===== User: route sessions =====
create table if not exists public.user_route_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  route_id uuid not null references public.routes(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  current_poi_index int not null default 0
);

create index if not exists user_route_sessions_user_idx
  on public.user_route_sessions (user_id);

create index if not exists user_route_sessions_active_idx
  on public.user_route_sessions (user_id)
  where completed_at is null;

-- ===== Row Level Security =====
alter table public.pois enable row level security;
alter table public.routes enable row level security;
alter table public.route_pois enable row level security;
alter table public.user_poi_favorites enable row level security;
alter table public.user_route_favorites enable row level security;
alter table public.user_poi_visits enable row level security;
alter table public.user_route_sessions enable row level security;

-- Public reads of published content
create policy "pois_read_published" on public.pois
  for select to anon, authenticated
  using (status = 'published');

create policy "routes_read_published" on public.routes
  for select to anon, authenticated
  using (status = 'published');

create policy "route_pois_read_published" on public.route_pois
  for select to anon, authenticated
  using (
    exists (select 1 from public.routes r where r.id = route_id and r.status = 'published')
    and exists (select 1 from public.pois p where p.id = poi_id and p.status = 'published')
  );

-- User-owned tables: users see/manage only their own rows
create policy "user_poi_favorites_self" on public.user_poi_favorites
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_route_favorites_self" on public.user_route_favorites
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_poi_visits_self" on public.user_poi_visits
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_route_sessions_self" on public.user_route_sessions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===== RPC: POIs in viewport =====
create or replace function public.pois_in_bbox(
  west float8,
  south float8,
  east float8,
  north float8
)
returns table (
  id uuid,
  slug text,
  name text,
  type text,
  short_blurb text,
  cover_image_url text,
  lng float8,
  lat float8
)
language sql
stable
set search_path = public
as $$
  select
    p.id,
    p.slug,
    p.name,
    p.type,
    p.short_blurb,
    p.cover_image_url,
    st_x(p.geom)::float8 as lng,
    st_y(p.geom)::float8 as lat
  from public.pois p
  where p.status = 'published'
    and p.geom && st_makeenvelope(west, south, east, north, 4326);
$$;

grant execute on function public.pois_in_bbox(float8, float8, float8, float8)
  to anon, authenticated;

-- ===== RPC: POIs near a point with distance =====
create or replace function public.pois_nearby(
  in_lng float8,
  in_lat float8,
  radius_m float8 default 500
)
returns table (
  id uuid,
  slug text,
  name text,
  type text,
  built_year int,
  short_blurb text,
  cover_image_url text,
  lng float8,
  lat float8,
  distance_m float8
)
language sql
stable
set search_path = public
as $$
  with origin as (
    select st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography as g
  )
  select
    p.id,
    p.slug,
    p.name,
    p.type,
    p.built_year,
    p.short_blurb,
    p.cover_image_url,
    st_x(p.geom)::float8 as lng,
    st_y(p.geom)::float8 as lat,
    st_distance(p.geom::geography, origin.g)::float8 as distance_m
  from public.pois p, origin
  where p.status = 'published'
    and st_dwithin(p.geom::geography, origin.g, radius_m)
  order by p.geom::geography <-> origin.g;
$$;

grant execute on function public.pois_nearby(float8, float8, float8)
  to anon, authenticated;
