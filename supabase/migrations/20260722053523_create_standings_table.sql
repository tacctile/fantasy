-- Season-cumulative standings, current snapshot only (Schema Rules
-- #1/#2/#3). One row per roster per league — PK (league_id,
-- native_roster_id) mirroring rosters; Wave 2 sync overwrites in
-- place. No weekly history: v1 rejects season-over-season views, and
-- per-week points live on matchups. Sleeper sources these figures from
-- the roster endpoint's nested settings object; ESPN from the mTeam
-- view.

create table public.standings (
  league_id uuid not null
    references public.leagues (platform_league_uuid) on delete cascade,
  native_roster_id integer not null,
  platform public.platform not null,
  season_year integer not null,
  -- A fresh league genuinely is 0-0 with 0.00 points — zero is a true
  -- state, not missing data, hence not-null defaults rather than
  -- nullable-until-synced.
  wins integer not null default 0,
  losses integer not null default 0,
  ties integer not null default 0,
  -- Single recombined decimal (Sleeper's fpts + fpts_decimal/100 —
  -- recombined at ingestion per the roster-endpoint ADR; the split
  -- integer/decimal wire pair is never stored). ESPN totals land here
  -- as-received.
  points_for numeric not null default 0,
  points_against numeric not null default 0,
  -- ESPN rank/playoff-seed and Sleeper waiver/transaction counters
  -- deliberately excluded: no registered v1 consumer, and ESPN's exact
  -- record field names are an open wiki question — Wave 2 adds them via
  -- new migration once verified against a live payload.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (league_id, native_roster_id),
  foreign key (league_id, native_roster_id)
    references public.rosters (league_id, native_roster_id) on delete cascade
);

alter table public.standings enable row level security;

create trigger set_updated_at
  before update on public.standings
  for each row execute function public.set_updated_at();
