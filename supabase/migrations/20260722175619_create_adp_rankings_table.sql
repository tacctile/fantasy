-- ADP rankings (Wave 3a): current-snapshot ADP per player per source, season,
-- and scoring format, ingested from the decided ADP source of record —
-- Sleeper's undocumented projections endpoint on api.sleeper.com (see
-- wiki/topics/sleeper-api/projections-endpoint.md). Long-row shape per Nick's
-- 2026-07-22 Clarify sign-off: the endpoint carries 12+ per-format adp_*
-- fields per player and the field inventory is demonstrably open, so formats
-- are rows (pattern-ingested from the field suffix), never a closed column
-- set. Current snapshot only — idempotent upsert overwrites in place; a
-- failed or implausible fetch writes nothing, preserving the last good
-- snapshot (validate-before-swap). Not league-scoped: ADP is market data
-- global to a source/season/format population, so Schema Rules #1/#2
-- (league_id/platform on league-scoped tables) do not apply; Schema Rule #3's
-- season_year is part of the key.
--
-- Blast radius: creates only this new table (+ its policy/trigger/index).
-- Name verified absent from the live shared prolabel schema before creation
-- (full 60-table public-schema listing, 2026-07-22).

create table public.adp_rankings (
  sleeper_player_id text not null
    references public.players (sleeper_player_id) on delete cascade,
  -- Ingestion source family; 'sleeper' = the undocumented projections
  -- endpoint. New sources extend the check via a new migration (sync_runs
  -- source-check precedent) — never free-text drift.
  adp_source text not null
    check (adp_source in ('sleeper')),
  season_year integer not null,
  -- The adp_* field suffix as-received ('ppr', 'half_ppr', 'std', '2qb',
  -- 'dynasty_ppr', ..., 'rookie'). Deliberately unconstrained text — the
  -- source's field inventory is open, and unrecognized variants must ingest
  -- as rows rather than fail (wiki pattern-ingestion decision).
  scoring_format text not null,
  -- Decimal draft-slot value as-received. The endpoint's 999.0 "no ADP in
  -- this format" sentinel is never ingested (sentinel rows are simply not
  -- written); the check backstops that plausibility rule at the schema layer.
  adp_overall numeric not null
    check (adp_overall > 0 and adp_overall < 999),
  -- Derived at ingestion: rank within players.position for this
  -- source/season/format, sentinel-excluded. Null when the player has no
  -- catalog position to rank within. The source provides no positional ADP —
  -- this is the platform's own derivation (Nick-signed 2026-07-22).
  positional_rank integer
    check (positional_rank >= 1),
  ingested_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (sleeper_player_id, adp_source, season_year, scoring_format)
);

alter table public.adp_rankings enable row level security;

create policy fantasy_owner_all on public.adp_rankings
  for all to authenticated
  using ((select public.is_fantasy_admin()))
  with check ((select public.is_fantasy_admin()));

create trigger set_updated_at
  before update on public.adp_rankings
  for each row execute function public.set_updated_at();

-- The draft-board read path: all rows for a source/season/format ordered by
-- ADP. The PK already leads with sleeper_player_id for per-player lookups
-- (no separate FK index — Postgres prefix rule, integrity-index convention).
create index idx_adp_rankings_source_season_format_adp
  on public.adp_rankings (adp_source, season_year, scoring_format, adp_overall);
