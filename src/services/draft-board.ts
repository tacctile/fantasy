/**
 * Draft-board query service (Wave 3a): produces the merged, ADP-ordered
 * player list plus league context for one league's static draft board.
 * Server-only; the admin draft-board route is its consumer — never any
 * spectator surface.
 *
 * Data-exposure boundary: every query selects explicit columns. This service
 * never returns `share_token`, `owner_id`, or provider-native league IDs —
 * the board needs none of them, and the spectator/admin boundary (Access
 * Model, MASTER_CONTEXT.md) treats leaked admin-surface fields as a data
 * exposure, not a cosmetic issue. An unknown, malformed, or inaccessible
 * `league_id` resolves to a typed not-found result — never a partial or
 * leaked response (malformed IDs are rejected before any query so genuine
 * database errors still throw rather than masquerading as not-found).
 *
 * Format resolution (Nick-signed 2026-07-22, wiki-grounded): the league's
 * `derived_config` maps to one adp_rankings scoring_format — superflex/2QB
 * leagues read '2qb' regardless of PPR value (QB replacement value is the
 * most format-sensitive axis, per league-mechanics/multi-platform-adp-
 * divergence), otherwise PPR buckets: >=1 → 'ppr', >0 → 'half_ppr', else
 * 'std'. Dynasty/IDP formats are deliberately unmapped in v1 (no such league
 * connected; derived_config carries no dynasty flag — the raw column is the
 * escape hatch per the league-configuration-data-model ADR). TE premium has
 * no ADP axis at the source, so it never affects format choice but rides in
 * the returned context. No cross-format fallback ever — a format with no
 * rows is an explicit empty state, not another format's numbers
 * (league-mechanics/average-draft-position: format leakage is the classic
 * ADP error).
 *
 * ADP season (Nick-signed): the latest season_year ingested for the source —
 * adp_rankings is a current-market snapshot and v1 rejects historical views,
 * so the board always shows the current market; the resolved season is
 * returned in the context for honest display.
 *
 * Board pool (Nick-signed): players carrying an ADP row for the resolved
 * (source, season, format) UNION players rostered in the league — availability
 * context stays complete even for ADP-less rostered players, which sort last
 * with null ADP. Availability is explicit ('rostered' | 'available') from
 * roster_players presence, never inferred from missing data. Ordering: ADP
 * ascending, nulls last, `sleeper_player_id` as the deterministic tie-breaker.
 *
 * Platform-agnostic by construction: every join key is the canonical
 * `sleeper_player_id` (ESPN players resolve through the crosswalk at Wave 2
 * ingestion, before rows ever reach these tables), so ESPN-league boards
 * render the same Sleeper-anchored fields through this exact code path once
 * ESPN sync lands — nothing here branches on platform.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

const ADP_SOURCE = 'sleeper'
const SELECT_CHUNK_SIZE = 500
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type DraftBoardAvailability = 'rostered' | 'available'

export type DraftBoardPlayer = {
  sleeperPlayerId: string
  fullName: string | null
  position: string | null
  team: string | null
  fantasyPositions: string[] | null
  injuryStatus: string | null
  /** Null = no ADP in the league's resolved format (sorts last). */
  adpOverall: number | null
  positionalRank: number | null
  availability: DraftBoardAvailability
  /** Set when availability is 'rostered' — which team holds the player. */
  rosteredByNativeRosterId: number | null
  rosteredByTeamName: string | null
  rosteredByOwnerDisplayName: string | null
}

export type DraftBoardLeagueContext = {
  /** platform_league_uuid — never a provider-native ID. */
  leagueId: string
  name: string | null
  platform: Database['public']['Enums']['platform']
  seasonYear: number
  /** Resolved adp_rankings format, or null when derived_config is unusable. */
  scoringFormat: string | null
  ppr: number | null
  tePremium: boolean | null
  superflex: boolean | null
  activeSlotCount: number | null
  benchSlotCount: number | null
  irSlotCount: number | null
  leagueSize: number | null
  adpSource: string
  /** Latest ingested ADP season, or null when nothing is ingested yet. */
  adpSeasonYear: number | null
  /** Freshness of the resolved format's snapshot (max ingested_at). */
  adpIngestedAt: string | null
}

export type DraftBoardData = {
  context: DraftBoardLeagueContext
  players: DraftBoardPlayer[]
}

export type DraftBoardResult =
  | { ok: true; data: DraftBoardData }
  | { ok: false; reason: 'league_not_found' }

/**
 * Map a league's derived_config to the adp_rankings scoring_format its board
 * reads. Returns null only for an unusable derived_config (defensive — the
 * derivation always writes a numeric ppr).
 */
export function resolveAdpScoringFormat(derived: {
  ppr?: unknown
  superflex?: unknown
}): string | null {
  if (derived.superflex === true) return '2qb'
  const ppr = derived.ppr
  if (typeof ppr !== 'number' || !Number.isFinite(ppr)) return null
  if (ppr >= 1) return 'ppr'
  if (ppr > 0) return 'half_ppr'
  return 'std'
}

/** Fetch the merged draft-board dataset for one league Nick owns. */
export async function getDraftBoardData(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<DraftBoardResult> {
  // Malformed IDs are not-found by definition; rejecting them here keeps the
  // uuid cast from ever erroring, so any query error below is a real failure.
  if (!UUID_PATTERN.test(leagueId)) return { ok: false, reason: 'league_not_found' }

  // Explicit columns only — share_token, owner_id, and native_league_id are
  // deliberately absent from this select and every other one in this module.
  const { data: league, error: leagueError } = await db
    .from('leagues')
    .select('platform_league_uuid, platform, season_year, name')
    .eq('platform_league_uuid', leagueId)
    .maybeSingle()
  if (leagueError) throw new Error(`draft-board league query failed: ${leagueError.message}`)
  if (league === null) return { ok: false, reason: 'league_not_found' }

  const { data: config, error: configError } = await db
    .from('league_config')
    .select('derived_config')
    .eq('league_id', leagueId)
    .maybeSingle()
  if (configError) throw new Error(`draft-board config query failed: ${configError.message}`)

  const derived = asRecord(config?.derived_config)
  const scoringFormat = derived === null ? null : resolveAdpScoringFormat(derived)

  // Latest ingested ADP season for the source (current-market snapshot).
  const { data: seasonRow, error: seasonError } = await db
    .from('adp_rankings')
    .select('season_year')
    .eq('adp_source', ADP_SOURCE)
    .order('season_year', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (seasonError) throw new Error(`draft-board ADP season query failed: ${seasonError.message}`)
  const adpSeasonYear = seasonRow?.season_year ?? null

  type AdpSlice = {
    adp_overall: number
    positional_rank: number | null
    ingested_at: string
  }
  const adpByPlayerId = new Map<string, AdpSlice>()
  let adpIngestedAt: string | null = null
  if (scoringFormat !== null && adpSeasonYear !== null) {
    const { data: adpRows, error: adpError } = await db
      .from('adp_rankings')
      .select('sleeper_player_id, adp_overall, positional_rank, ingested_at')
      .eq('adp_source', ADP_SOURCE)
      .eq('season_year', adpSeasonYear)
      .eq('scoring_format', scoringFormat)
    if (adpError) throw new Error(`draft-board ADP query failed: ${adpError.message}`)
    for (const row of adpRows) {
      adpByPlayerId.set(row.sleeper_player_id, {
        adp_overall: Number(row.adp_overall),
        positional_rank: row.positional_rank,
        ingested_at: row.ingested_at,
      })
      if (adpIngestedAt === null || row.ingested_at > adpIngestedAt) {
        adpIngestedAt = row.ingested_at
      }
    }
  }

  // League roster membership — explicit availability, never inferred.
  const { data: membershipRows, error: membershipError } = await db
    .from('roster_players')
    .select('sleeper_player_id, native_roster_id')
    .eq('league_id', leagueId)
  if (membershipError) {
    throw new Error(`draft-board membership query failed: ${membershipError.message}`)
  }
  const rosterByPlayerId = new Map(
    membershipRows.map((row) => [row.sleeper_player_id, row.native_roster_id])
  )

  const { data: rosterRows, error: rosterError } = await db
    .from('rosters')
    .select('native_roster_id, team_name, owner_display_name')
    .eq('league_id', leagueId)
  if (rosterError) throw new Error(`draft-board rosters query failed: ${rosterError.message}`)
  const rosterNames = new Map(
    rosterRows.map((row) => [
      row.native_roster_id,
      { teamName: row.team_name, ownerDisplayName: row.owner_display_name },
    ])
  )

  // Board pool: ADP carriers ∪ league-rostered (Nick-signed).
  const poolIds = [...new Set([...adpByPlayerId.keys(), ...rosterByPlayerId.keys()])]

  type PlayerSlice = {
    full_name: string | null
    position: string | null
    team: string | null
    fantasy_positions: string[] | null
    injury_status: string | null
  }
  const playersById = new Map<string, PlayerSlice>()
  for (let offset = 0; offset < poolIds.length; offset += SELECT_CHUNK_SIZE) {
    const chunk = poolIds.slice(offset, offset + SELECT_CHUNK_SIZE)
    const { data: playerRows, error: playersError } = await db
      .from('players')
      .select('sleeper_player_id, full_name, position, team, fantasy_positions, injury_status')
      .in('sleeper_player_id', chunk)
    if (playersError) {
      throw new Error(`draft-board players query failed: ${playersError.message}`)
    }
    for (const row of playerRows) {
      playersById.set(row.sleeper_player_id, {
        full_name: row.full_name,
        position: row.position,
        team: row.team,
        fantasy_positions: row.fantasy_positions,
        injury_status: row.injury_status,
      })
    }
  }

  const players: DraftBoardPlayer[] = poolIds.map((playerId) => {
    const identity = playersById.get(playerId)
    const adp = adpByPlayerId.get(playerId)
    const nativeRosterId = rosterByPlayerId.get(playerId)
    const rostered = nativeRosterId !== undefined
    const names = rostered ? rosterNames.get(nativeRosterId) : undefined
    return {
      sleeperPlayerId: playerId,
      fullName: identity?.full_name ?? null,
      position: identity?.position ?? null,
      team: identity?.team ?? null,
      fantasyPositions: identity?.fantasy_positions ?? null,
      injuryStatus: identity?.injury_status ?? null,
      adpOverall: adp?.adp_overall ?? null,
      positionalRank: adp?.positional_rank ?? null,
      availability: rostered ? 'rostered' : 'available',
      rosteredByNativeRosterId: rostered ? nativeRosterId : null,
      rosteredByTeamName: names?.teamName ?? null,
      rosteredByOwnerDisplayName: names?.ownerDisplayName ?? null,
    }
  })

  // ADP ascending, nulls last, deterministic sleeper_player_id tie-break.
  players.sort((a, b) => {
    const adpA = a.adpOverall ?? Number.POSITIVE_INFINITY
    const adpB = b.adpOverall ?? Number.POSITIVE_INFINITY
    if (adpA !== adpB) return adpA - adpB
    return a.sleeperPlayerId < b.sleeperPlayerId
      ? -1
      : a.sleeperPlayerId > b.sleeperPlayerId
        ? 1
        : 0
  })

  return {
    ok: true,
    data: {
      context: {
        leagueId: league.platform_league_uuid,
        name: league.name,
        platform: league.platform,
        seasonYear: league.season_year,
        scoringFormat,
        ppr: asNumber(derived?.ppr),
        tePremium: asBoolean(derived?.te_premium),
        superflex: asBoolean(derived?.superflex),
        activeSlotCount: asNumber(derived?.active_slot_count),
        benchSlotCount: asNumber(derived?.bench_slot_count),
        irSlotCount: asNumber(derived?.ir_slot_count),
        leagueSize: asNumber(derived?.league_size),
        adpSource: ADP_SOURCE,
        adpSeasonYear,
        adpIngestedAt,
      },
      players,
    },
  }
}

// derived_config is JSONB — parse defensively; a malformed value degrades to
// nulls (and a null scoringFormat), never a throw or an invented default.

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}
