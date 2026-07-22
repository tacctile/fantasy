-- Integrity index sweep (Wave 1, Schema — integrity).
-- Adds only indexes not already provided by an existing PK/unique btree whose
-- leading column(s) cover the lookup (Postgres leading-column prefix rule).
-- Already covered, deliberately not duplicated:
--   league_id      — leading PK column on league_config/rosters/roster_players/
--                    matchups/standings/player_scores/draft_state; leagues PK itself
--   share_token    — leagues_share_token_key unique index
--   espn_player_id — player_id_crosswalk partial unique index (where not null)
--   sleeper_player_id — PK on players and player_id_crosswalk
--   platform (leagues) — leads the (platform, native_league_id, season_year) unique

-- FK support: the one FK referencing leagues.platform_league_uuid with no index
create index idx_leagues_previous_platform_league_uuid
  on public.leagues (previous_platform_league_uuid);

-- sleeper_player_id where it is never a leading column
create index idx_roster_players_sleeper_player_id
  on public.roster_players (sleeper_player_id);
create index idx_player_scores_sleeper_player_id
  on public.player_scores (sleeper_player_id);
create index idx_draft_state_sleeper_player_id
  on public.draft_state (sleeper_player_id);

-- platform
create index idx_rosters_platform on public.rosters (platform);
create index idx_roster_players_platform on public.roster_players (platform);
create index idx_matchups_platform on public.matchups (platform);
create index idx_standings_platform on public.standings (platform);
create index idx_player_scores_platform on public.player_scores (platform);
create index idx_draft_state_platform on public.draft_state (platform);

-- season_year
create index idx_leagues_season_year on public.leagues (season_year);
create index idx_rosters_season_year on public.rosters (season_year);
create index idx_roster_players_season_year on public.roster_players (season_year);
create index idx_matchups_season_year on public.matchups (season_year);
create index idx_standings_season_year on public.standings (season_year);
create index idx_player_scores_season_year on public.player_scores (season_year);
create index idx_draft_state_season_year on public.draft_state (season_year);
