-- Per-player weekly fantasy scores (Schema Rules #1/#2/#3/#4). One row
-- per rostered player per league row per week — a player's fantasy value
-- is never a single global number, always (player, league), because
-- scoring settings differ per league. Sleeper sources this from the
-- matchup endpoint's players_points map (league-scored by Sleeper —
-- never the generic pts_std/pts_ppr preset fields, which reflect
-- Sleeper's defaults rather than the league's settings); ESPN from
-- player stat records selected at ingestion by all three discriminators
-- (scoringPeriodId + statSourceId + statSplitTypeId) so a projection or
-- season split is never mistaken for a weekly actual. Free-agent scores
-- never appear in these payloads, so every row is inherently a rostered
-- player.

create table public.player_scores (
  league_id uuid not null
    references public.leagues (platform_league_uuid) on delete cascade,
  sleeper_player_id text not null
    references public.players (sleeper_player_id) on delete cascade,
  -- NFL stat-accumulation interval: Sleeper week / ESPN scoringPeriodId.
  -- Contest-interval grouping (multi-week playoff rounds) lives on
  -- matchups; player stats are always keyed to the scoring period.
  week integer not null,
  platform public.platform not null,
  season_year integer not null,
  -- Which roster held the player that week, as-received from the same
  -- payload the score came from. This is the only per-week attribution
  -- record — roster_players is a current-state snapshot, and mRoster
  -- cannot reconstruct past weeks.
  native_roster_id integer not null,
  -- Whether the score counted toward the roster's total: Sleeper
  -- starters[] membership; ESPN lineupSlotId within the league's active
  -- slot set per league_config — never inferred from default position.
  was_starter boolean not null,
  -- League-scored points as-received. Not null: a row only exists when
  -- the source reported a numeric value; zero lands as-received (the
  -- zero-vs-not-yet-played ambiguity is a consumer concern). Negative
  -- values are legitimate (DST, turnovers). ESPN projected/live columns
  -- deliberately excluded — exact field names are an open wiki question;
  -- Wave 2 adds them via new migration once verified live.
  points numeric not null,
  -- Same finality reality as matchups: no payload signals final, and
  -- corrections run for days after games end (DST/IDP most volatile).
  -- Sync stamps each read; is_final is promoted only by our own policy.
  fetched_at timestamptz,
  is_final boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (league_id, sleeper_player_id, week),
  foreign key (league_id, native_roster_id)
    references public.rosters (league_id, native_roster_id) on delete cascade
);

alter table public.player_scores enable row level security;

create trigger set_updated_at
  before update on public.player_scores
  for each row execute function public.set_updated_at();
