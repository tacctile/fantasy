/**
 * Wire types for Sleeper read endpoints consumed by this service.
 *
 * Deliberately permissive (per wiki/topics/sleeper-api/players-endpoint.md,
 * Field-Schema Drift): field presence is uneven across records and Sleeper
 * adds fields without notice, so every field beyond the map key is optional
 * and unrecognized fields are preserved via the index signature — never
 * rejected. All IDs are opaque strings, never numerically coerced (D/ST
 * records use team abbreviations like "DET" as their player_id).
 */

/** One record from `GET /players/nfl`. */
export type SleeperPlayerRecord = {
  player_id?: string | null
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  position?: string | null
  fantasy_positions?: string[] | null
  team?: string | null
  status?: string | null
  injury_status?: string | null
  search_full_name?: string | null
  search_rank?: number | null
  birth_date?: string | null
  [key: string]: unknown
}

/**
 * `GET /players/nfl` — a single JSON object keyed by Sleeper `player_id`
 * (a map, not an array), covering every player Sleeper tracks including
 * inactive and historical entries.
 */
export type SleeperPlayersCatalog = Record<string, SleeperPlayerRecord>

/**
 * `GET /league/{league_id}` — one league object (per
 * wiki/topics/sleeper-api/league-endpoint.md). `settings` and
 * `scoring_settings` are open maps with no exhaustive documented key set —
 * they are typed as unknown-valued records and stored as-received, never
 * parsed against a fixed schema. `season` is a string on the wire, not a
 * number.
 */
/**
 * One roster from `GET /league/{league_id}/rosters` (per
 * wiki/topics/sleeper-api/roster-endpoint.md). `roster_id` is the durable
 * team key; `owner_id` is nullable (orphaned rosters are a normal state).
 * `starters` entries can be placeholders (null or a sentinel) for empty
 * slots — the array is positional against the league's active slot layout.
 * There is no bench array on the wire; bench is derived by three-way
 * subtraction. `settings` carries standings figures including the split
 * integer/decimal points pairs.
 */
export type SleeperRoster = {
  roster_id?: number | null
  owner_id?: string | null
  co_owners?: string[] | null
  players?: string[] | null
  starters?: (string | null)[] | null
  reserve?: string[] | null
  taxi?: string[] | null
  settings?: Record<string, unknown> | null
  [key: string]: unknown
}

/**
 * One league member from `GET /league/{league_id}/users` (per
 * wiki/topics/sleeper-api/users-endpoint.md) — an account, not a team: no
 * roster_id here; the join to rosters is owner_id/co_owners → user_id.
 * `is_owner` means commissioner, never roster ownership. The league-scoped
 * custom team name lives at `metadata.team_name` (missing and empty string
 * both mean unset).
 */
export type SleeperLeagueUser = {
  user_id?: string | null
  display_name?: string | null
  username?: string | null
  is_owner?: boolean | null
  metadata?: Record<string, unknown> | null
  [key: string]: unknown
}

/**
 * One row from `GET /league/{league_id}/matchups/{week}` (per
 * wiki/topics/sleeper-api/matchup-endpoint.md) — one object per roster, never
 * per contest. Rows sharing a non-null `matchup_id` are the two sides of one
 * pairing (null = bye/no opponent); `matchup_id` is only meaningful within a
 * single league-week. `custom_points` is a commissioner override that takes
 * precedence when non-null. `players_points` maps every rostered player
 * (starters + bench) to their league-scored weekly points; `starters` is
 * positional with the same placeholder behavior as the roster endpoint. No
 * finality flag exists anywhere in this payload.
 */
export type SleeperMatchup = {
  roster_id?: number | null
  matchup_id?: number | null
  points?: number | null
  custom_points?: number | null
  starters?: (string | null)[] | null
  starters_points?: (number | null)[] | null
  players?: string[] | null
  players_points?: Record<string, number | null> | null
  [key: string]: unknown
}

export type SleeperLeague = {
  league_id?: string | null
  name?: string | null
  season?: string | null
  sport?: string | null
  status?: string | null
  total_rosters?: number | null
  previous_league_id?: string | null
  draft_id?: string | null
  settings?: Record<string, unknown> | null
  scoring_settings?: Record<string, unknown> | null
  roster_positions?: string[] | null
  [key: string]: unknown
}

/**
 * One draft object from `GET /league/{league_id}/drafts` (per
 * wiki/topics/sleeper-api/draft-endpoint.md). The endpoint returns an array —
 * a league can carry multiple drafts, including aborted/restarted ones that
 * are never deleted, so selection filters on `season`/`status` and never
 * trusts array order or the league object's single `draft_id`. `status`
 * values observed: `pre_draft`, `drafting`, `paused`, `complete`. `type` is
 * `snake`, `linear`, or `auction` (open set). `season` is a string on the
 * wire, like the league object's.
 */
export type SleeperDraft = {
  draft_id?: string | null
  league_id?: string | null
  season?: string | null
  type?: string | null
  status?: string | null
  settings?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  slot_to_roster_id?: Record<string, number | null> | null
  draft_order?: Record<string, number | null> | null
  [key: string]: unknown
}

/**
 * One pick from `GET /draft/{draft_id}/picks` (per
 * wiki/topics/sleeper-api/draft-endpoint.md). `roster_id` is the ownership
 * field — the roster that actually receives the player, reflecting in-draft
 * pick trades; `draft_slot` is the original board column and `picked_by` the
 * clicking human (empty string for autopicks/commissioner picks), and the
 * three are never interchangeable. `metadata` is a point-in-time snapshot of
 * the player at pick time — stale immediately for current-state use; its
 * `amount` (auction winning bid) arrives as a string.
 */
export type SleeperDraftPick = {
  pick_no?: number | null
  round?: number | null
  draft_slot?: number | null
  roster_id?: number | null
  picked_by?: string | null
  player_id?: string | null
  is_keeper?: boolean | null
  metadata?: Record<string, unknown> | null
  [key: string]: unknown
}
