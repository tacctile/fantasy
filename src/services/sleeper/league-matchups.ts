/**
 * Sleeper weekly matchups + player-scores sync (Wave 2): fetches
 * `/league/{league_id}/matchups/{week}` and upserts `matchups` (one row per
 * roster per week — the wire's own grain; pairings are reconstructed at read
 * time by grouping on (league_id, week, native_matchup_id) with group-size
 * validation, never forced into home/away pairs here) and `player_scores`
 * (the response's `players_points` map — already scored by Sleeper under the
 * league's own settings; this is pure ingestion, never score computation).
 *
 * Finality: the payload carries no final/settled flag, so rows are stamped
 * with `fetched_at` and promoted per our own policy (matchup-endpoint ADR).
 * This service's policy slice: a league whose lifecycle status is `complete`
 * has every week past the stat-correction window, so its rows land
 * `is_final = true`; any other status lands `false`, with in-season
 * promotion (games complete + correction window + stable repeat reads)
 * deferred to the cron sub-section. Historical rows are never deleted —
 * these tables are the per-week record, so the sync is upsert-only.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import { sleeperGet } from './client'
import type { SleeperLeague, SleeperMatchup } from './types'

// Weeks 1–18 cover every NFL stat week; nonexistent weeks return an empty
// array and are skipped, so the sweep over-asks harmlessly.
const FULL_SEASON_WEEKS = Array.from({ length: 18 }, (_, i) => i + 1)
const UPSERT_CHUNK_SIZE = 500

type MatchupInsert = Database['public']['Tables']['matchups']['Insert']
type PlayerScoreInsert = Database['public']['Tables']['player_scores']['Insert']

export type LeagueMatchupsSyncResult = {
  startedAt: string
  completedAt: string
  leagueUuid: string
  seasonYear: number
  /** Weeks whose response carried at least one roster row. */
  weeksSynced: number[]
  /** Weeks that returned an empty response (out of range for the league). */
  weeksEmpty: number[]
  matchupRowCount: number
  playerScoreRowCount: number
  /** True when the league's lifecycle status marked every row final. */
  markedFinal: boolean
  /**
   * Player IDs in `players_points` absent from our catalog — their score
   * rows are skipped and reported (Nick's 2026-07-22 ruling), self-healing
   * after the next daily catalog run + re-sync.
   */
  skippedMissingPlayerIds: string[]
  /** `players_points` entries whose value was not a number (wire drift). */
  skippedNonNumericScores: number
}

/**
 * Sync one Sleeper league's weekly matchups and per-player weekly scores.
 * Sweeps the full season by default; pass `week` to sync a single week (the
 * in-season cadence the orchestrator/cron will use).
 */
export async function syncLeagueMatchups(
  db: SupabaseClient<Database>,
  nativeLeagueId: string,
  options?: { week?: number }
): Promise<LeagueMatchupsSyncResult> {
  const startedAt = new Date().toISOString()

  const { data: leagueRow, error: leagueError } = await db
    .from('leagues')
    .select('platform_league_uuid, season_year')
    .eq('platform', 'sleeper')
    .eq('native_league_id', nativeLeagueId)
    .maybeSingle()
  if (leagueError) {
    throw new Error(`league lookup failed: ${leagueError.message}`)
  }
  if (leagueRow === null) {
    throw new Error(
      `league ${nativeLeagueId} is not connected — run the league-config sync first`
    )
  }
  const leagueUuid = leagueRow.platform_league_uuid
  const seasonYear = leagueRow.season_year

  // Lifecycle status drives the finality stamp; the league object is the
  // authoritative source and the fetch is cheap.
  const league = await sleeperGet<SleeperLeague>(`/league/${nativeLeagueId}`)
  const isFinal = asString(league?.status) === 'complete'

  const weeks = options?.week !== undefined ? [options.week] : FULL_SEASON_WEEKS

  const matchupRows: MatchupInsert[] = []
  const playerScoreRows: PlayerScoreInsert[] = []
  const weeksSynced: number[] = []
  const weeksEmpty: number[] = []
  let skippedNonNumericScores = 0

  for (const week of weeks) {
    const weekRows = await sleeperGet<SleeperMatchup[]>(
      `/league/${nativeLeagueId}/matchups/${week}`
    )
    const validated = validateMatchups(weekRows, week)
    if (validated.length === 0) {
      weeksEmpty.push(week)
      continue
    }
    weeksSynced.push(week)

    for (const matchup of validated) {
      matchupRows.push({
        league_id: leagueUuid,
        week,
        native_roster_id: matchup.roster_id,
        platform: 'sleeper',
        season_year: seasonYear,
        // Sleeper has no native contest-interval ID — the schema check
        // enforces matchup_period = week on sleeper rows.
        matchup_period: week,
        native_matchup_id: asInteger(matchup.matchup_id),
        is_home: null,
        points: asNumber(matchup.points),
        custom_points: asNumber(matchup.custom_points),
        fetched_at: startedAt,
        is_final: isFinal,
      })

      const starterIds = new Set<string>()
      if (Array.isArray(matchup.starters)) {
        for (const entry of matchup.starters) {
          const playerId = asPlayerId(entry)
          if (playerId !== null) starterIds.add(playerId)
        }
      }
      const playersPoints = asPlainObject(matchup.players_points) ?? {}
      for (const [playerId, rawPoints] of Object.entries(playersPoints)) {
        if (asPlayerId(playerId) === null) continue
        const points = asNumber(rawPoints)
        if (points === null) {
          skippedNonNumericScores += 1
          continue
        }
        playerScoreRows.push({
          league_id: leagueUuid,
          sleeper_player_id: playerId,
          week,
          platform: 'sleeper',
          season_year: seasonYear,
          native_roster_id: matchup.roster_id,
          was_starter: starterIds.has(playerId),
          points,
          fetched_at: startedAt,
          is_final: isFinal,
        })
      }
    }
  }

  // Skip-and-record for score rows whose player our catalog doesn't hold.
  const skippedMissingPlayerIds = await findMissingPlayerIds(
    db,
    playerScoreRows.map((row) => row.sleeper_player_id)
  )
  const missing = new Set(skippedMissingPlayerIds)
  const persistableScores = playerScoreRows.filter(
    (row) => !missing.has(row.sleeper_player_id)
  )

  for (let offset = 0; offset < matchupRows.length; offset += UPSERT_CHUNK_SIZE) {
    const chunk = matchupRows.slice(offset, offset + UPSERT_CHUNK_SIZE)
    const { error } = await db
      .from('matchups')
      .upsert(chunk, { onConflict: 'league_id,week,native_roster_id' })
    if (error) {
      throw new Error(
        `matchups upsert failed at rows ${offset}–${offset + chunk.length - 1}: ${error.message}`
      )
    }
  }

  for (let offset = 0; offset < persistableScores.length; offset += UPSERT_CHUNK_SIZE) {
    const chunk = persistableScores.slice(offset, offset + UPSERT_CHUNK_SIZE)
    const { error } = await db
      .from('player_scores')
      .upsert(chunk, { onConflict: 'league_id,sleeper_player_id,week' })
    if (error) {
      throw new Error(
        `player_scores upsert failed at rows ${offset}–${offset + chunk.length - 1}: ${error.message}`
      )
    }
  }

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    leagueUuid,
    seasonYear,
    weeksSynced,
    weeksEmpty,
    matchupRowCount: matchupRows.length,
    playerScoreRowCount: persistableScores.length,
    markedFinal: isFinal,
    skippedMissingPlayerIds,
    skippedNonNumericScores,
  }
}

type ValidatedMatchup = SleeperMatchup & { roster_id: number }

/**
 * Validate one week's response before anything is persisted: an array (empty
 * is a valid out-of-range week, not a failure) in which every entry carries
 * an integer `roster_id` — the join key back to rosters and the only
 * guaranteed identity field on this endpoint.
 */
function validateMatchups(rows: SleeperMatchup[], week: number): ValidatedMatchup[] {
  if (!Array.isArray(rows)) {
    throw new Error(`matchups validation failed: week ${week} response is not an array`)
  }
  return rows.map((row) => {
    if (
      typeof row !== 'object' ||
      row === null ||
      typeof row.roster_id !== 'number' ||
      !Number.isInteger(row.roster_id)
    ) {
      throw new Error(
        `matchups validation failed: week ${week} entry without an integer roster_id`
      )
    }
    return row as ValidatedMatchup
  })
}

/** Query which of the given player IDs are absent from our catalog. */
async function findMissingPlayerIds(
  db: SupabaseClient<Database>,
  playerIds: string[]
): Promise<string[]> {
  const unique = Array.from(new Set(playerIds))
  if (unique.length === 0) return []
  const { data, error } = await db
    .from('players')
    .select('sleeper_player_id')
    .in('sleeper_player_id', unique)
  if (error) {
    throw new Error(`players existence check failed: ${error.message}`)
  }
  const existing = new Set(data.map((row) => row.sleeper_player_id))
  return unique.filter((id) => !existing.has(id))
}

// Wire-value coercers (drift guards, same posture as the sibling services).

/**
 * A usable player-ID entry: non-empty string, excluding the "0" empty-slot
 * sentinel used in `starters`. D/ST team-abbreviation IDs pass through —
 * IDs are opaque strings, never numerically parsed.
 */
function asPlayerId(value: unknown): string | null {
  const id = asString(value)
  return id !== null && id !== '0' ? id : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

function asPlainObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}
