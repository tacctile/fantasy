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
