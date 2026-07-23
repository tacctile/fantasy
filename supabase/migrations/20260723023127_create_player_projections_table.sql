-- Player projections (Wave 3b, BPA prerequisite — Nick-signed correctness
-- amendment 2026-07-22): current-snapshot season projection record per player
-- per source per season, ingested from the SAME undocumented api.sleeper.com
-- projections endpoint — and the same single fetch — as adp_rankings (fused
-- ingestion, Nick-signed; see wiki/topics/sleeper-api/projections-endpoint.md,
-- the source of record for this surface). The BPA/VORP engine scores the
-- component stats with each league's actual league_config weights at read
-- time (Nick's decision of record: preset pts_* format buckets are never used
-- as league values). Current snapshot only — idempotent upsert overwrites in
-- place; a failed or implausible fetch writes nothing, preserving the last
-- good snapshot (validate-before-swap). Not league-scoped: projections are
-- vendor/market data global to a source/season population, so Schema Rules
-- #1/#2 (league_id/platform on league-scoped tables) do not apply
-- (adp_rankings precedent); Schema Rule #3's season_year is part of the key.
--
-- Blast radius: creates only this new table (+ its policy/trigger/index).
-- Name verified absent from the live shared prolabel schema before creation
-- (information_schema listing, 2026-07-22).

create table public.player_projections (
  sleeper_player_id text not null
    references public.players (sleeper_player_id) on delete cascade,
  -- Ingestion source family; 'sleeper' = the undocumented projections
  -- endpoint. New sources extend the check via a new migration (adp_rankings
  -- / sync_runs source-check precedent) — never free-text drift.
  projection_source text not null
    check (projection_source in ('sleeper')),
  season_year integer not null,
  -- The record's full stats object as-received: component projection stats
  -- (attempts, yards, receptions, TDs, ...), preset pts_* totals, and the
  -- adp_* fields INCLUDING their 999.0 sentinels — a raw snapshot per the
  -- wiki's permissive-parsing decision (the field inventory is demonstrably
  -- open). ADP is never read from here: adp_rankings is the sentinel-filtered
  -- ADP read path; consumers of this table read the component stats only.
  stats jsonb not null,
  -- Provenance as-received: projections vendor (observed "rotowire" —
  -- whether the adp_* fields are vendor- or Sleeper-native is an open wiki
  -- question) and the record's own epoch-ms timestamps as timestamptz.
  company text,
  source_last_modified timestamptz,
  source_updated_at timestamptz,
  ingested_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (sleeper_player_id, projection_source, season_year)
);

alter table public.player_projections enable row level security;

create policy fantasy_owner_all on public.player_projections
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create trigger set_updated_at
  before update on public.player_projections
  for each row execute function public.set_updated_at();

-- The BPA read path: every projection row for a source/season (position and
-- identity join through players). The PK already leads with
-- sleeper_player_id for per-player lookups (Postgres prefix rule —
-- integrity-index convention).
create index idx_player_projections_source_season
  on public.player_projections (projection_source, season_year);
