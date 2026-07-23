/**
 * BPA recommendations query (Wave 3b BPA item 6): the server-side read that
 * turns the pure layer into a ranked, top-N candidate list for one league's
 * live board — the FIRST I/O in bpa/ (items 1–5 are pure).
 *
 * Ranked PURELY by base VORP (build-file mandate) — the independent roster-need
 * signal rides along as a separate per-row annotation and a context summary,
 * NEVER folded into the ordering (item 5's hard constraint). ADP is returned
 * beside the value, a comparison signal, never conflated with it
 * (value-based-drafting.md).
 *
 * Dynamic-recompute wiring (item 4): every call rebuilds the pool as
 * projections MINUS the current draft_state picks and recomputes the whole
 * chain via computeBpaBoard — no cached baseline. Item 9 re-invokes this per
 * pick, so the shrinking pool is realized here, not stored.
 *
 * Tier-cliff surfacing (tier-cliff items 1–3): computeBpaBoard now also returns
 * per-position tier structure over the same shrinking pool. Each recommendation
 * row carries its within-position `tier`, and the context carries whole-board
 * per-position tier summaries (count + "N in the best available tier") — the
 * data the board's live tier counter (item 4, next session) renders. Tiers
 * recompute per pick for free, riding the same re-call as the base values.
 *
 * Data-loading boundary (draft-board.ts precedent): explicit columns only;
 * never selects share_token / owner_id / native_league_id. Admin surface only —
 * player_projections and adp_rankings have no spectator consumer (STATE.yml
 * Rule-13 warning). Platform-agnostic by construction: every join key is the
 * canonical sleeper_player_id (ESPN resolves through the crosswalk upstream),
 * so ESPN leagues use this exact path once connected — nothing branches on
 * platform.
 *
 * Current-market season (draft-board.ts precedent): projections and ADP come
 * from the latest ingested snapshot for the source, independent of the league's
 * own season — v1 rejects historical views and the board always shows the
 * current market.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'
import { parseRosterSlotLayout, resolveAdpScoringFormat } from '@/services/draft-board'
import { listDraftPicks } from '@/services/draft-picks'

import { computeBpaBoard } from './board'
import type { AdpCalibrationPlayer } from './calibration'
import {
  classifyPositionNeed,
  computeRosterNeed,
  type NeedKind,
  type RosterNeedSignal,
} from './need'
import type { ReplacementPoolPlayer } from './replacement'
import { parseScoringWeights, scoreProjectionStats } from './scoring'
import { summarizeTiers, type PositionTierSummary } from './tiers'

const PROJECTION_SOURCE = 'sleeper'
const ADP_SOURCE = 'sleeper'
const DEFAULT_TOP_N = 10
const SELECT_CHUNK_SIZE = 500
const PROJECTION_PAGE_SIZE = 1000
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type BpaRecommendation = {
  sleeperPlayerId: string
  fullName: string | null
  position: string
  team: string | null
  /** League-scored projection (scoring.ts). */
  projectedPoints: number
  /** The operative replacement line applied (calibrated or structural). */
  replacementPoints: number
  /** projectedPoints − replacementPoints. Negatives possible late in a draft. */
  baseValue: number
  replacementSource: 'adp' | 'structural'
  /** Overall market ADP in the resolved format, or null (no ADP row). */
  adpOverall: number | null
  /** Independent need annotation for this player's position — null when no
   *  selfRosterId was supplied or the layout is unavailable. NEVER an input to
   *  baseValue or ordering (build-file hard constraint). */
  need: NeedKind | null
  /** This player's tier within its position (tier-cliff items 1–3), 1 = best
   *  available tier. Null when the player sits below the replacement line
   *  (untiered tail). A parallel display signal like `need` — never an input to
   *  baseValue or ordering. */
  tier: number | null
}

export type BpaRecommendationsContext = {
  leagueId: string
  /** Projection season used (latest ingested for the source). */
  seasonYear: number
  scoringFormat: string | null
  calibration: 'adp' | 'structural_only'
  leagueSize: number
  /** Undrafted players carrying a scoreable projection (rankable + unrankable). */
  poolSize: number
  rankableCount: number
  /** draft_state picks removed from the pool this call. */
  draftedCount: number
  unrankableCount: number
  unrankablePositions: string[]
  topN: number
  needComputed: boolean
  selfRosterId: number | null
  /** Full roster need signal for the panel's roster-summary strip — present
   *  only when needComputed; separate from the per-row `need` annotations. */
  need: RosterNeedSignal | null
  /** Per-position tier summaries over the WHOLE undrafted board (not just the
   *  top-N rows) — tier count and "N remaining in the best available tier" per
   *  position, the data the board's live tier counter renders (tier-cliff item
   *  4 consumes this). Recomputed every call against the shrinking pool. */
  tiers: Record<string, PositionTierSummary>
}

export type BpaRecommendationsResult =
  | {
      ok: true
      data: {
        recommendations: BpaRecommendation[]
        context: BpaRecommendationsContext
      }
    }
  | { ok: false; reason: 'league_not_found' | 'config_unusable' | 'projections_unavailable' }

export type BpaRecommendationsOptions = {
  /** How many top-ranked candidates to return (default 10 — Nick's Clarify
   *  decision; the item-7 panel passes its own). */
  topN?: number
  /** Whose roster the need signal describes. Omit for value-only output
   *  (need null throughout) — the item-7 panel supplies it (Nick's Clarify
   *  decision; no "my team" marker exists in the schema). */
  selfRosterId?: number
}

/**
 * Top-N BPA candidates for one league Nick owns, ranked by base VORP against
 * the current undrafted pool.
 */
export async function getBpaRecommendations(
  db: SupabaseClient<Database>,
  leagueId: string,
  options?: BpaRecommendationsOptions
): Promise<BpaRecommendationsResult> {
  if (!UUID_PATTERN.test(leagueId)) return { ok: false, reason: 'league_not_found' }
  const topN = normalizeTopN(options?.topN)
  const selfRosterId = options?.selfRosterId ?? null

  // League existence (explicit columns — boundary discipline).
  const { data: league, error: leagueError } = await db
    .from('leagues')
    .select('platform_league_uuid')
    .eq('platform_league_uuid', leagueId)
    .maybeSingle()
  if (leagueError) throw new Error(`bpa league query failed: ${leagueError.message}`)
  if (league === null) return { ok: false, reason: 'league_not_found' }

  // League config: scoring weights (required), roster layout (required for
  // replacement), format (may be null → structural-only), league size (required
  // — computeReplacementLevels throws without a positive integer).
  const { data: config, error: configError } = await db
    .from('league_config')
    .select('scoring_settings_raw, roster_settings_raw, derived_config')
    .eq('league_id', leagueId)
    .maybeSingle()
  if (configError) throw new Error(`bpa config query failed: ${configError.message}`)

  const weights = parseScoringWeights(config?.scoring_settings_raw)
  const layout = parseRosterSlotLayout(config?.roster_settings_raw)
  const derived = asRecord(config?.derived_config)
  const scoringFormat = derived === null ? null : resolveAdpScoringFormat(derived)
  const leagueSize = asPositiveInteger(derived?.league_size)
  if (weights === null || layout === null || leagueSize === null) {
    return { ok: false, reason: 'config_unusable' }
  }

  // Latest ingested projection season for the source (current-market snapshot).
  const { data: seasonRow, error: seasonError } = await db
    .from('player_projections')
    .select('season_year')
    .eq('projection_source', PROJECTION_SOURCE)
    .order('season_year', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (seasonError) throw new Error(`bpa projection-season query failed: ${seasonError.message}`)
  const seasonYear = seasonRow?.season_year ?? null
  if (seasonYear === null) return { ok: false, reason: 'projections_unavailable' }

  // All projection rows for the season (paginated — the season snapshot exceeds
  // PostgREST's default page cap; never rely on a single unbounded select).
  const projectionRows = await loadAllProjections(db, seasonYear)
  if (projectionRows.length === 0) return { ok: false, reason: 'projections_unavailable' }

  // ADP carriers for the resolved format/season (calibration input) — real
  // ADPs (adp_rankings is the sentinel-filtered read path, never projections).
  type AdpSlice = { sleeperPlayerId: string; adpOverall: number }
  const adpSlices: AdpSlice[] = []
  if (scoringFormat !== null) {
    const { data: adpRows, error: adpError } = await db
      .from('adp_rankings')
      .select('sleeper_player_id, adp_overall')
      .eq('adp_source', ADP_SOURCE)
      .eq('season_year', seasonYear)
      .eq('scoring_format', scoringFormat)
    if (adpError) throw new Error(`bpa ADP query failed: ${adpError.message}`)
    for (const row of adpRows) {
      const value = Number(row.adp_overall)
      if (Number.isFinite(value)) adpSlices.push({ sleeperPlayerId: row.sleeper_player_id, adpOverall: value })
    }
  }

  // Catalog identity/position for every projection + ADP player (positions are
  // the grouping key for pool AND carriers).
  const catalogIds = new Set<string>()
  for (const row of projectionRows) catalogIds.add(row.sleeper_player_id)
  for (const slice of adpSlices) catalogIds.add(slice.sleeperPlayerId)
  const playersById = await loadPlayers(db, [...catalogIds])

  // Drafted set + this-roster positions come from the one snapshot read.
  const picks = await listDraftPicks(db, leagueId)
  const draftedIds = new Set(picks.map((pick) => pick.sleeperPlayerId))
  const selfRosterPositions: string[] = []
  if (selfRosterId !== null) {
    for (const pick of picks) {
      if (pick.nativeRosterId === selfRosterId && pick.playerPosition !== null) {
        selfRosterPositions.push(pick.playerPosition)
      }
    }
  }

  // Scored, undrafted pool — drafted players removed here (the shrinking pool).
  const pool: ReplacementPoolPlayer[] = []
  const adpByPlayerId = new Map<string, number>(
    adpSlices.map((slice) => [slice.sleeperPlayerId, slice.adpOverall])
  )
  for (const row of projectionRows) {
    if (draftedIds.has(row.sleeper_player_id)) continue
    const identity = playersById.get(row.sleeper_player_id)
    const position = identity?.position ?? null
    if (position === null) continue
    const projectedPoints = scoreProjectionStats(row.stats, weights)
    if (projectedPoints === null) continue
    pool.push({ sleeperPlayerId: row.sleeper_player_id, position, projectedPoints })
  }

  // ADP carriers need a catalog position (same grouping key as the pool).
  const adpCarriers: AdpCalibrationPlayer[] = []
  for (const slice of adpSlices) {
    const position = playersById.get(slice.sleeperPlayerId)?.position ?? null
    if (position === null) continue
    adpCarriers.push({
      sleeperPlayerId: slice.sleeperPlayerId,
      position,
      adpOverall: slice.adpOverall,
    })
  }

  // Recompute the whole board against the shrunk pool (item 4).
  const board = computeBpaBoard(pool, layout, leagueSize, adpCarriers.length > 0 ? adpCarriers : null)

  // Roster need signal (item 5) — separate from the value ranking.
  const needSignal =
    selfRosterId !== null ? computeRosterNeed(selfRosterPositions, layout) : null

  const recommendations: BpaRecommendation[] = board.baseValues.players
    .slice(0, topN)
    .map((player) => {
      const identity = playersById.get(player.sleeperPlayerId)
      return {
        sleeperPlayerId: player.sleeperPlayerId,
        fullName: identity?.full_name ?? null,
        position: player.position,
        team: identity?.team ?? null,
        projectedPoints: player.projectedPoints,
        replacementPoints: player.replacementPoints,
        baseValue: player.baseValue,
        replacementSource: player.replacementSource,
        adpOverall: adpByPlayerId.get(player.sleeperPlayerId) ?? null,
        need: needSignal !== null ? classifyPositionNeed(needSignal, player.position) : null,
        tier: board.tiers.byPosition[player.position]?.tierByPlayerId[player.sleeperPlayerId] ?? null,
      }
    })

  // Per-position tier summaries over the full board (item 4's counter data).
  const tierSummaries = summarizeTiers(board.tiers)

  return {
    ok: true,
    data: {
      recommendations,
      context: {
        leagueId,
        seasonYear,
        scoringFormat,
        calibration: board.replacementLevels.calibration,
        leagueSize,
        poolSize: pool.length,
        rankableCount: board.baseValues.players.length,
        draftedCount: draftedIds.size,
        unrankableCount: board.baseValues.unrankableCount,
        unrankablePositions: board.baseValues.unrankablePositions,
        topN,
        needComputed: needSignal !== null,
        selfRosterId,
        need: needSignal,
        tiers: tierSummaries,
      },
    },
  }
}

async function loadAllProjections(
  db: SupabaseClient<Database>,
  seasonYear: number
): Promise<Array<{ sleeper_player_id: string; stats: Database['public']['Tables']['player_projections']['Row']['stats'] }>> {
  const rows: Array<{
    sleeper_player_id: string
    stats: Database['public']['Tables']['player_projections']['Row']['stats']
  }> = []
  for (let from = 0; ; from += PROJECTION_PAGE_SIZE) {
    const { data, error } = await db
      .from('player_projections')
      .select('sleeper_player_id, stats')
      .eq('projection_source', PROJECTION_SOURCE)
      .eq('season_year', seasonYear)
      .order('sleeper_player_id', { ascending: true })
      .range(from, from + PROJECTION_PAGE_SIZE - 1)
    if (error) throw new Error(`bpa projections query failed: ${error.message}`)
    rows.push(...data)
    if (data.length < PROJECTION_PAGE_SIZE) break
  }
  return rows
}

type PlayerSlice = { full_name: string | null; position: string | null; team: string | null }

async function loadPlayers(
  db: SupabaseClient<Database>,
  ids: string[]
): Promise<Map<string, PlayerSlice>> {
  const playersById = new Map<string, PlayerSlice>()
  for (let offset = 0; offset < ids.length; offset += SELECT_CHUNK_SIZE) {
    const chunk = ids.slice(offset, offset + SELECT_CHUNK_SIZE)
    const { data, error } = await db
      .from('players')
      .select('sleeper_player_id, full_name, position, team')
      .in('sleeper_player_id', chunk)
    if (error) throw new Error(`bpa players query failed: ${error.message}`)
    for (const row of data) {
      playersById.set(row.sleeper_player_id, {
        full_name: row.full_name,
        position: row.position,
        team: row.team,
      })
    }
  }
  return playersById
}

function normalizeTopN(value: number | undefined): number {
  if (value === undefined || !Number.isInteger(value) || value < 1) return DEFAULT_TOP_N
  return value
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asPositiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}
