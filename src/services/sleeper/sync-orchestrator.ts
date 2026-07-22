/**
 * Per-league Sleeper sync orchestrator (Wave 2): runs the four league-scoped
 * syncs in dependency order — league config → rosters → matchups → draft
 * (rosters before draft because draft_state's roster FK requires them; draft
 * added to the chain by Nick-signed scope amendment 2026-07-22) — across
 * every connected Sleeper league, isolating each league completely: one
 * league's failure records which step broke and why, skips that league's
 * remaining steps, and never blocks the other leagues' sync.
 *
 * A full run processes all `leagues` rows where platform='sleeper' (Nick's
 * 2026-07-22 ruling — completed leagues are cheap idempotent re-syncs, so
 * correctness never depends on status guessing); pass `leagueIds` to sync a
 * subset. Request pacing is enforced globally by the Sleeper client's
 * minimum-gap gate, so multi-league fan-out here needs no additional
 * throttling. The player catalog is deliberately NOT part of this chain —
 * its once-per-day rule gives it its own cadence (players-catalog service).
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import { syncLeagueDraftState } from './draft-state'
import type { LeagueDraftSyncResult } from './draft-state'
import { syncLeagueConfig } from './league-config'
import type { LeagueConfigSyncResult } from './league-config'
import { syncLeagueMatchups } from './league-matchups'
import type { LeagueMatchupsSyncResult } from './league-matchups'
import { syncLeagueRosters } from './league-rosters'
import type { LeagueRostersSyncResult } from './league-rosters'

export type LeagueSyncStep = 'league_config' | 'rosters' | 'matchups' | 'draft'

/** One league's outcome — either all four steps or a step failure with the rest skipped. */
export type LeagueSyncOutcome = {
  nativeLeagueId: string
  ok: boolean
  /** Results of the steps that completed, in chain order. */
  config?: LeagueConfigSyncResult
  rosters?: LeagueRostersSyncResult
  matchups?: LeagueMatchupsSyncResult
  draft?: LeagueDraftSyncResult
  /** The step that failed; absent when ok. */
  failedStep?: LeagueSyncStep
  /** Failure detail — may contain league IDs, server logs only. */
  error?: string
  /** Steps not attempted because an earlier step failed. */
  skippedSteps: LeagueSyncStep[]
}

export type SleeperSyncRunResult = {
  startedAt: string
  completedAt: string
  leagues: LeagueSyncOutcome[]
  okCount: number
  failedCount: number
}

/** Native league IDs of every connected Sleeper league, in deterministic order. */
export async function discoverConnectedSleeperLeagueIds(
  db: SupabaseClient<Database>
): Promise<string[]> {
  const { data, error } = await db
    .from('leagues')
    .select('native_league_id')
    .eq('platform', 'sleeper')
    .order('native_league_id')
  if (error) {
    throw new Error(`connected-league discovery failed: ${error.message}`)
  }
  return data.map((row) => row.native_league_id)
}

/**
 * Sync all connected Sleeper leagues (or an explicit subset) in dependency
 * order with per-league failure isolation. `week` is passed through to the
 * matchups sync for the in-season cron cadence; omitting it sweeps the full
 * season. `skipMatchups` drops the matchups step entirely — the scheduled
 * sync uses it when `/state/nfl` reports no scoreable fantasy week
 * (`pre`/`post`/`off`), where a sweep would only re-fetch immutable data.
 */
export async function syncAllSleeperLeagues(
  db: SupabaseClient<Database>,
  options?: { leagueIds?: string[]; week?: number; skipMatchups?: boolean }
): Promise<SleeperSyncRunResult> {
  const startedAt = new Date().toISOString()

  let leagueIds: string[]
  if (options?.leagueIds !== undefined && options.leagueIds.length > 0) {
    leagueIds = options.leagueIds
  } else {
    leagueIds = await discoverConnectedSleeperLeagueIds(db)
  }

  const leagues: LeagueSyncOutcome[] = []
  for (const nativeLeagueId of leagueIds) {
    leagues.push(
      await syncOneLeague(db, nativeLeagueId, options?.week, options?.skipMatchups === true)
    )
  }

  const okCount = leagues.filter((outcome) => outcome.ok).length
  return {
    startedAt,
    completedAt: new Date().toISOString(),
    leagues,
    okCount,
    failedCount: leagues.length - okCount,
  }
}

const CHAIN: LeagueSyncStep[] = ['league_config', 'rosters', 'matchups', 'draft']

/** Run one league's chain; a step failure records itself and skips the rest. */
async function syncOneLeague(
  db: SupabaseClient<Database>,
  nativeLeagueId: string,
  week: number | undefined,
  skipMatchups: boolean
): Promise<LeagueSyncOutcome> {
  const outcome: LeagueSyncOutcome = {
    nativeLeagueId,
    ok: false,
    skippedSteps: [],
  }

  const chain = skipMatchups ? CHAIN.filter((step) => step !== 'matchups') : CHAIN

  for (const step of chain) {
    try {
      switch (step) {
        case 'league_config':
          outcome.config = await syncLeagueConfig(db, nativeLeagueId)
          break
        case 'rosters':
          outcome.rosters = await syncLeagueRosters(db, nativeLeagueId)
          break
        case 'matchups':
          outcome.matchups = await syncLeagueMatchups(db, nativeLeagueId, { week })
          break
        case 'draft':
          outcome.draft = await syncLeagueDraftState(db, nativeLeagueId)
          break
      }
    } catch (error) {
      outcome.failedStep = step
      outcome.error = error instanceof Error ? error.message : String(error)
      outcome.skippedSteps = chain.slice(chain.indexOf(step) + 1)
      return outcome
    }
  }

  outcome.ok = true
  return outcome
}
