-- League configuration as data, never hardcoded application assumptions
-- (Schema Rule #5). Shape fixed by the schema-reference/league-configuration-
-- data-model ADR: raw provider payloads stored as-received plus a small
-- derived subset. 1:1 extension of leagues — league_id is both PK and FK, so
-- platform/season_year live on the parent leagues row (already one row per
-- platform-season-league) and are not duplicated here. The PK also satisfies
-- the integrity item's league_id index requirement for this table.
create table public.league_config (
  league_id uuid primary key
    references public.leagues (platform_league_uuid) on delete cascade,
  -- Provider-native scoring payload stored as-received: Sleeper's
  -- scoring_settings object, or ESPN's scoring-rules payload. The faithful,
  -- complete record of what the league actually does — undocumented Sleeper
  -- keys (incl. the distinct IDP key family) and custom ESPN rules land here
  -- untouched.
  scoring_settings_raw jsonb not null,
  -- Provider-native roster payload stored as-received: Sleeper's
  -- roster_positions array plus relevant settings fields, or ESPN's
  -- mSettings.rosterSettings.lineupSlotCounts. Never a hardcoded slot table.
  roster_settings_raw jsonb not null,
  -- Platform-agnostic normalized subset application code queries day to day:
  -- PPR value, TE-premium flag, superflex/2-QB flag, active/bench/IR slot
  -- counts, league size. Computed at ingestion (Wave 2) and re-derived in
  -- full on every settings refresh — never hand-edited, never an independent
  -- source of truth. Features needing an uncovered setting read the raw
  -- columns instead of guessing here.
  derived_config jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.league_config enable row level security;

create trigger set_updated_at
  before update on public.league_config
  for each row execute function public.set_updated_at();
