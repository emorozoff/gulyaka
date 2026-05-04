-- Гуляка — content-pipeline upsert helper
-- Apply via Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- Adds an `upsert_poi` RPC used by `pnpm content:import` to publish POIs
-- from the content-pipeline output. Keeps geometry construction (lng/lat →
-- ST_SetSRID(ST_MakePoint, 4326)) on the server so the script can stay
-- type-safe.
--
-- Calling convention:
--   - Default (in_overwrite = false): INSERT ... ON CONFLICT (slug) DO NOTHING.
--     Returns the new row's id, or NULL if a row with that slug already exists.
--     Safe for re-runs — manual edits in Supabase are preserved.
--   - With in_overwrite = true: full upsert — replaces every column on conflict.
--     Use only when you intentionally want to clobber prior content.

create or replace function public.upsert_poi(
  in_slug text,
  in_name text,
  in_lng double precision,
  in_lat double precision,
  in_type text,
  in_address text default null,
  in_built_year int default null,
  in_architect text default null,
  in_short_blurb text default null,
  in_long_text text default null,
  in_fact_cards jsonb default '[]'::jsonb,
  in_cover_image_url text default null,
  in_cover_image_credit text default null,
  in_sources jsonb default '{}'::jsonb,
  in_status text default 'draft',
  in_overwrite boolean default false
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  if in_overwrite then
    insert into public.pois (
      slug, name, address, geom, type, built_year, architect,
      short_blurb, long_text, fact_cards, cover_image_url, cover_image_credit,
      sources, status
    ) values (
      in_slug, in_name, in_address,
      ST_SetSRID(ST_MakePoint(in_lng, in_lat), 4326),
      in_type, in_built_year, in_architect,
      in_short_blurb, in_long_text, in_fact_cards,
      in_cover_image_url, in_cover_image_credit,
      in_sources, in_status
    )
    on conflict (slug) do update set
      name = excluded.name,
      address = excluded.address,
      geom = excluded.geom,
      type = excluded.type,
      built_year = excluded.built_year,
      architect = excluded.architect,
      short_blurb = excluded.short_blurb,
      long_text = excluded.long_text,
      fact_cards = excluded.fact_cards,
      cover_image_url = excluded.cover_image_url,
      cover_image_credit = excluded.cover_image_credit,
      sources = excluded.sources,
      status = excluded.status,
      updated_at = now()
    returning id into v_id;
  else
    insert into public.pois (
      slug, name, address, geom, type, built_year, architect,
      short_blurb, long_text, fact_cards, cover_image_url, cover_image_credit,
      sources, status
    ) values (
      in_slug, in_name, in_address,
      ST_SetSRID(ST_MakePoint(in_lng, in_lat), 4326),
      in_type, in_built_year, in_architect,
      in_short_blurb, in_long_text, in_fact_cards,
      in_cover_image_url, in_cover_image_credit,
      in_sources, in_status
    )
    on conflict (slug) do nothing
    returning id into v_id;
  end if;
  return v_id;
end $$;

-- Service role bypasses RLS and can call any function. Lock down the public
-- roles so a leaked anon/authenticated key can't bulk-write.
revoke execute on function public.upsert_poi(
  text, text, double precision, double precision, text,
  text, int, text, text, text, jsonb, text, text, jsonb, text, boolean
) from anon, authenticated;
