-- League-scoped team identity (Schema Rules #1/#2/#3). One row per team slot
-- per league row; leagues is already one row per platform-season-league, so
-- the pair (league_id, native_roster_id) is the full identity for both
-- platforms — Sleeper keys rosters by (league, roster_id), ESPN by
-- (league, season, teamId) with season carried here by the parent league row.
-- Ownership is an attribute of a roster, never part of its key: orphaned
-- (owner-less) and co-owned rosters are normal states on both platforms.
-- Standings figures and player-membership arrays deliberately do not live
-- here — they belong to the standings and roster_players tables respectively.
create table public.rosters (
  league_id uuid not null
    references public.leagues (platform_league_uuid) on delete cascade,
  -- Sleeper roster_id or ESPN teamId, as-received: both are wire integers,
  -- league-scoped, and stable for the life of the team slot.
  native_roster_id integer not null,
  platform public.platform not null,
  season_year integer not null,
  -- Sleeper owner_id or ESPN primaryOwner memberId. Nullable: an orphaned
  -- roster (departed user, unfilled slot, commissioner-managed team) is a
  -- normal state, not an error. Text, never integer — Sleeper user_id is a
  -- large numeric string, ESPN memberId a GUID-like string.
  owner_native_id text,
  -- Sleeper co_owners / ESPN non-primary owners[] entries, preserved in
  -- full. Primary ownership lives in owner_native_id, never in array
  -- position.
  co_owner_native_ids text[] not null default '{}',
  -- Mutable display attributes, never join keys. Populated by Wave 2 sync:
  -- Sleeper team names come from the users endpoint's fallback hierarchy
  -- (not the rosters endpoint), ESPN's from the team object.
  team_name text,
  owner_display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (league_id, native_roster_id)
);

alter table public.rosters enable row level security;

create trigger set_updated_at
  before update on public.rosters
  for each row execute function public.set_updated_at();
