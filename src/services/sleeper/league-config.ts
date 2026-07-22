/**
 * Sleeper league-metadata sync (Wave 2): fetches `/league/{league_id}` and
 * upserts the league's identity row (`leagues`) plus its configuration row
 * (`league_config`).
 *
 * Identity keying follows the schema-reference/league-identity-and-scoping
 * ADR: the internal `platform_league_uuid` is minted here at ingestion (the
 * one place provider continuity logic lives), the native ID is stored
 * as-received and never used as a join key, and Sleeper's `previous_league_id`
 * is resolved against existing rows only — v1 ingests the current season, so
 * an unresolvable prior season leaves the chain column null rather than
 * creating historical rows.
 *
 * Configuration storage follows the schema-reference/league-configuration-
 * data-model ADR: provider-native payloads land as-received in the two raw
 * JSONB columns (open maps — unrecognized keys preserved, absent scoring keys
 * never zero-filled), and `derived_config` is a small normalized convenience
 * subset re-derived in full on every refresh, never hand-edited.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, Json } from '@/lib/supabase/database.types'

import { sleeperGet } from './client'
import type { SleeperLeague } from './types'

// Canonical rotation point for admin identity is public.is_fantasy_admin()
// in the database; this constant mirrors it for row attribution only.
const FANTASY_ADMIN_USER_ID = '1d5dab52-9b93-4544-a99b-6d4dc3c84a66'

// roster_positions labels that are not starting slots (per
// sleeper-api/league-endpoint.md — bench/reserve/taxi appear in the same
// array as starting slots, distinguished only by label).
const NON_ACTIVE_SLOT_LABELS = new Set(['BN', 'IR', 'TAXI'])

/**
 * Normalized settings subset per the league-configuration-data-model ADR's
 * fixed field inventory. Anything beyond these reads the raw columns.
 */
export type DerivedLeagueConfig = {
  ppr: number
  te_premium: boolean
  superflex: boolean
  active_slot_count: number
  bench_slot_count: number
  ir_slot_count: number
  league_size: number
}

export type LeagueConfigSyncResult = {
  startedAt: string
  completedAt: string
  leagueUuid: string
  nativeLeagueId: string
  leagueName: string
  seasonYear: number
  leagueStatus: string | null
  /** Null when the wire carried no `previous_league_id` at all. */
  previousChainResolved: boolean | null
  derivedConfig: DerivedLeagueConfig
}

/**
 * Fetch one Sleeper league's metadata and upsert `leagues` + `league_config`.
 *
 * League configuration is a slow-changing resource (league-endpoint Key
 * Decision): callers refresh it on explicit trigger or a low-frequency
 * schedule, never alongside every roster/matchup fetch.
 */
export async function syncLeagueConfig(
  db: SupabaseClient<Database>,
  nativeLeagueId: string
): Promise<LeagueConfigSyncResult> {
  const startedAt = new Date().toISOString()

  const league = await sleeperGet<SleeperLeague>(`/league/${nativeLeagueId}`)
  const validated = validateLeague(league, nativeLeagueId)

  // Resolve the renewal chain against rows we already hold; v1 never creates
  // prior-season rows, so "no existing row" resolves to null, not a fetch.
  let previousUuid: string | null = null
  let previousChainResolved: boolean | null = null
  const previousNativeId = asString(league.previous_league_id)
  if (previousNativeId) {
    const { data: previousRow, error: previousError } = await db
      .from('leagues')
      .select('platform_league_uuid')
      .eq('platform', 'sleeper')
      .eq('native_league_id', previousNativeId)
      .maybeSingle()
    if (previousError) {
      throw new Error(`previous-league lookup failed: ${previousError.message}`)
    }
    previousUuid = previousRow?.platform_league_uuid ?? null
    previousChainResolved = previousUuid !== null
  }

  const { data: leagueRow, error: leagueError } = await db
    .from('leagues')
    .upsert(
      {
        platform: 'sleeper',
        season_year: validated.seasonYear,
        native_league_id: nativeLeagueId,
        name: validated.name,
        previous_platform_league_uuid: previousUuid,
        owner_id: FANTASY_ADMIN_USER_ID,
      },
      { onConflict: 'platform,native_league_id,season_year' }
    )
    .select('platform_league_uuid')
    .single()
  if (leagueError) {
    throw new Error(`leagues upsert failed: ${leagueError.message}`)
  }

  const derivedConfig = deriveConfig(validated)

  const { error: configError } = await db.from('league_config').upsert(
    {
      league_id: leagueRow.platform_league_uuid,
      scoring_settings_raw: validated.scoringSettings as Json,
      // The provider-native roster payload is the roster_positions array plus
      // the settings object (open map, unrecognized keys preserved).
      roster_settings_raw: {
        roster_positions: validated.rosterPositions,
        settings: validated.settings,
      } as unknown as Json,
      derived_config: derivedConfig as unknown as Json,
    },
    { onConflict: 'league_id' }
  )
  if (configError) {
    throw new Error(`league_config upsert failed: ${configError.message}`)
  }

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    leagueUuid: leagueRow.platform_league_uuid,
    nativeLeagueId,
    leagueName: validated.name,
    seasonYear: validated.seasonYear,
    leagueStatus: asString(league.status),
    previousChainResolved,
    derivedConfig,
  }
}

type ValidatedLeague = {
  name: string
  seasonYear: number
  leagueSize: number
  scoringSettings: Record<string, unknown>
  settings: Record<string, unknown>
  rosterPositions: string[]
}

/**
 * Validate the league response before anything is persisted (the service
 * layer's validate-before-persist pattern): identity echo, a parseable
 * season, and structurally sound settings/scoring/roster payloads. A failure
 * here leaves both tables untouched.
 */
function validateLeague(league: SleeperLeague, requestedId: string): ValidatedLeague {
  if (typeof league !== 'object' || league === null || Array.isArray(league)) {
    throw new Error('league validation failed: response is not a plain object')
  }
  if (league.league_id !== requestedId) {
    throw new Error(
      `league validation failed: response echoes league_id ${String(league.league_id)}, requested ${requestedId}`
    )
  }
  const sport = asString(league.sport)
  if (sport !== null && sport !== 'nfl') {
    throw new Error(`league validation failed: sport is ${sport}, expected nfl`)
  }

  // leagues.name is NOT NULL by schema — a nameless response fails here,
  // before anything is persisted.
  const name = asString(league.name)
  if (name === null) {
    throw new Error('league validation failed: name is missing or empty')
  }

  const season = asString(league.season)
  if (season === null || !/^\d{4}$/.test(season)) {
    throw new Error(
      `league validation failed: season ${String(league.season)} is not a 4-digit year string`
    )
  }
  const seasonYear = Number.parseInt(season, 10)

  const scoringSettings = asPlainObject(league.scoring_settings)
  if (scoringSettings === null) {
    throw new Error('league validation failed: scoring_settings is not an object')
  }
  const settings = asPlainObject(league.settings)
  if (settings === null) {
    throw new Error('league validation failed: settings is not an object')
  }

  const rosterPositions = league.roster_positions
  if (
    !Array.isArray(rosterPositions) ||
    rosterPositions.length === 0 ||
    !rosterPositions.every((slot): slot is string => typeof slot === 'string')
  ) {
    throw new Error(
      'league validation failed: roster_positions is not a non-empty string array'
    )
  }

  const leagueSize = asPositiveInteger(league.total_rosters) ?? asPositiveInteger(settings.num_teams)
  if (leagueSize === null) {
    throw new Error(
      'league validation failed: neither total_rosters nor settings.num_teams is a positive integer'
    )
  }

  return { name, seasonYear, leagueSize, scoringSettings, settings, rosterPositions }
}

/**
 * Compute the normalized subset from the validated payload. Absent scoring
 * keys contribute zero here (the scoring-math equivalence) — the raw column
 * keeps the absent-vs-explicit-zero distinction intact.
 *
 * TE premium: no wiki page documents Sleeper's TE-premium wire key (declared
 * silence, 2026-07-22) — `bonus_rec_te` (per-reception TE bonus) > 0 is the
 * general-knowledge derivation, correctable by re-derivation on any refresh.
 */
function deriveConfig(validated: ValidatedLeague): DerivedLeagueConfig {
  const { scoringSettings, rosterPositions } = validated

  const qbSlotCount = rosterPositions.filter((slot) => slot === 'QB').length

  return {
    ppr: asNumber(scoringSettings.rec) ?? 0,
    te_premium: (asNumber(scoringSettings.bonus_rec_te) ?? 0) > 0,
    superflex: rosterPositions.includes('SUPER_FLEX') || qbSlotCount >= 2,
    active_slot_count: rosterPositions.filter((slot) => !NON_ACTIVE_SLOT_LABELS.has(slot))
      .length,
    bench_slot_count: rosterPositions.filter((slot) => slot === 'BN').length,
    ir_slot_count: rosterPositions.filter((slot) => slot === 'IR').length,
    league_size: validated.leagueSize,
  }
}

// Wire-value coercers (drift guards, same posture as players-catalog):
// unexpected types normalize to null rather than crash; empty strings are
// one absence representation.

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asPositiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

function asPlainObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}
