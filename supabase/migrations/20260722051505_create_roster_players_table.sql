-- Roster membership join (Schema Rules #1/#2/#4). One row per rostered
-- player per team per league row — the platform-agnostic resolution of
-- Sleeper's players/starters/reserve/taxi arrays and ESPN's mRoster
-- entries. Always keyed by sleeper_player_id (canonical identity), never
-- a platform-native player ID: ESPN playerId resolves through
-- player_id_crosswalk at ingestion, and D/ST rows anchor on Sleeper's
-- team-abbreviation player_id (e.g. 'DET'), which the text key carries
-- uncorrupted. Current-state snapshot only, like the provider resources
-- it mirrors — historical weekly lineups belong to matchups, so no week
-- column exists here.

-- Normalized cross-platform role, resolved once at ingestion: Sleeper
-- bench is the three-way set subtraction (players minus starters minus
-- reserve minus taxi — never starters alone); ESPN lineupSlotId 20 maps
-- to bench, 21 to reserve, any active slot to starter. taxi is
-- Sleeper-only (dynasty).
create type public.roster_slot as enum ('starter', 'bench', 'reserve', 'taxi');

create table public.roster_players (
  league_id uuid not null
    references public.leagues (platform_league_uuid) on delete cascade,
  native_roster_id integer not null,
  sleeper_player_id text not null
    references public.players (sleeper_player_id) on delete cascade,
  platform public.platform not null,
  season_year integer not null,
  slot public.roster_slot not null,
  -- Sleeper starters only: index into the roster's starters[] array,
  -- positionally meaningful only against the league's ordered lineup-slot
  -- layout in league_config (empty slots hold placeholders there, so
  -- indexes of populated entries are preserved as-received).
  starter_slot_index integer,
  -- ESPN only: raw lineupSlotId as-received. Slot semantics are per-league
  -- data (mSettings.rosterSettings.lineupSlotCounts), never a global table
  -- alone.
  espn_lineup_slot_id integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (league_id, native_roster_id, sleeper_player_id),
  foreign key (league_id, native_roster_id)
    references public.rosters (league_id, native_roster_id) on delete cascade,
  -- A player appears on at most one roster per league row. Two rosters
  -- claiming the same player in one snapshot is corrupt data — fail loudly
  -- at sync time rather than double-count in availability derivations.
  unique (league_id, sleeper_player_id),
  constraint starter_slot_index_starters_only
    check (starter_slot_index is null
           or (slot = 'starter' and platform = 'sleeper')),
  constraint espn_lineup_slot_id_espn_only
    check (espn_lineup_slot_id is null or platform = 'espn')
);

alter table public.roster_players enable row level security;

create trigger set_updated_at
  before update on public.roster_players
  for each row execute function public.set_updated_at();
