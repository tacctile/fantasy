/**
 * ADP domain types (Wave 3a). Wire types mirror the observed response of
 * Sleeper's undocumented projections endpoint on api.sleeper.com — see
 * wiki/topics/sleeper-api/projections-endpoint.md, the source of record for
 * this surface. The endpoint has no contract: every field is optional and
 * unknown-preserving (permissive parsing is a wiki-decided requirement, not
 * a style choice).
 */
import type { Database } from '@/lib/supabase/database.types'

/** Embedded convenience player object on a projection record. The players
 * catalog remains canonical for identity/attributes — this is spot-check
 * metadata only, never a substitute for the `players` table. */
export type AdpProjectionPlayer = {
  first_name?: string | null
  last_name?: string | null
  position?: string | null
  fantasy_positions?: string[] | null
  team?: string | null
  injury_status?: string | null
  years_exp?: number | null
  [key: string]: unknown
}

/** One element of the endpoint's JSON array (NOT an ID-keyed map — unlike
 * the documented players dump). `player_id` carries the native Sleeper
 * canonical ID; `stats` mixes projection stats and the `adp_*` fields. */
export type AdpProjectionRecord = {
  player_id?: string | null
  season?: string | null
  season_type?: string | null
  sport?: string | null
  week?: number | null
  game_id?: string | null
  category?: string | null
  /** Projections vendor (observed `"rotowire"`). Whether the adp_* fields
   * are Sleeper-native or vendor-supplied is an open wiki question. */
  company?: string | null
  team?: string | null
  opponent?: string | null
  last_modified?: number | null
  updated_at?: number | null
  player?: AdpProjectionPlayer | null
  stats?: Record<string, unknown> | null
  [key: string]: unknown
}

/** One extracted, sentinel-filtered ADP value: a player's average draft
 * position in one scoring format (`scoringFormat` = the `adp_*` field suffix
 * as-received, e.g. `'ppr'`, `'half_ppr'`, `'dynasty_2qb'` — open set). */
export type AdpEntry = {
  sleeperPlayerId: string
  scoringFormat: string
  adpOverall: number
}

/** Database row shape for `adp_rankings` writes. */
export type AdpRow = Database['public']['Tables']['adp_rankings']['Insert']

/** Database row shape for `player_projections` writes (Wave 3b BPA
 * prerequisite — fused into the same ingestion run/fetch as ADP,
 * Nick-signed 2026-07-22). */
export type PlayerProjectionRow = Database['public']['Tables']['player_projections']['Insert']

/** Outcome of one ADP ingestion run. Skip/unmapped counts are first-class:
 * nothing is silently dropped (unmapped players are recorded, never used to
 * mint identity rows — Schema Rule #4). */
export type AdpIngestionResult = {
  startedAt: string
  completedAt: string
  seasonYear: number
  adpSource: 'sleeper'
  /** Raw records in the response array. */
  fetchedRecordCount: number
  /** Records carrying at least one real (non-sentinel) adp_* value. */
  recordsWithAdpCount: number
  /** Real ADP values extracted across all formats. */
  extractedEntryCount: number
  /** adp_* values excluded as the 999.0 "no ADP in this format" sentinel. */
  sentinelSkippedCount: number
  /** adp_* values excluded as non-numeric or out of the plausible range. */
  implausibleValueCount: number
  /** Distinct fetched players (ADP entries and/or projection records) with
   * no `players` catalog row (FK target). Self-heals after the next daily
   * catalog sync. */
  unmappedPlayerCount: number
  unmappedPlayerIds: string[]
  upsertedRowCount: number
  /** Prior-snapshot rows removed because this validated run no longer
   * carries them (current-snapshot semantics). */
  staleRowsDeletedCount: number
  /** Distinct scoring-format suffixes observed this run. */
  formatsSeen: string[]
  /** `player_projections` rows persisted from this run's single fetch
   * (fused ingestion — one player/source/season row carrying the full
   * as-received stats object). */
  projectionRowsPersistedCount: number
  /** Prior-snapshot `player_projections` rows removed because this validated
   * run no longer carries them (current-snapshot semantics). */
  projectionStaleRowsDeletedCount: number
}
