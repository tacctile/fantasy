/**
 * Draft-session state (Wave 3b, active-draft polling orchestration) — the
 * read/write surface for the admin-only `draft_sessions` table. The
 * `is_draft_active` flag is what elevates draft polling to live cadence;
 * Nick toggles it from the board toolbar at the real start/end of a draft.
 *
 * Admin surface only — the table carries the owner RLS policy exclusively and
 * must never become spectator-reachable at any wave (build-file mandate; it
 * is a separate table from `leagues`/`league_config` precisely because those
 * receive spectator SELECT policies in Wave 4).
 *
 * Soft TTL (Nick's 2026-07-22 Clarify decision): a forgotten flag must not
 * keep elevated polling armed indefinitely, so readers treat the flag as
 * inactive once `activated_at` is older than 6 hours — computed at read time,
 * never by a scheduled job mutating the row. Toggling on again resets the
 * clock. `isStale` distinguishes "expired" from "explicitly stopped" so the
 * UI can say so honestly.
 *
 * Activation runs one inline draft-state sync for Sleeper leagues (Nick's
 * Clarify decision: the board starts from fresh authoritative picks the
 * moment the draft goes live). The sync outcome is reported but never rolls
 * back the flag, and it is recorded in `sync_runs` like any other draft poll.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import {
  syncLeagueDraftState,
  type DraftOrderMeta,
} from './sleeper/draft-state'
import { recordSyncRunSafely } from './sync-runs'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Longest realistic snake draft plus margin (Nick-signed, 2026-07-22). */
export const DRAFT_ACTIVE_TTL_HOURS = 6

export type DraftSessionState = {
  leagueId: string
  /** Effective flag: the stored flag AND within the soft TTL. */
  isDraftActive: boolean
  /** Stored flag true but the TTL has lapsed — "expired", not "stopped". */
  isStale: boolean
  activatedAt: string | null
  deactivatedAt: string | null
}

export type DraftSessionValidationError = {
  outcome: 'validation_error'
  reason: 'league_not_found'
  message: string
}

export type DraftSessionStateResult =
  | { outcome: 'ok'; session: DraftSessionState }
  | DraftSessionValidationError

/** Outcome of one recorded draft poll (activation-time or elevated tick). */
export type DraftPollSyncOutcome =
  | {
      status: 'success'
      picksFetched: number
      picksWritten: number
      picksAlreadyRecorded: number
      /** Selected draft's order metadata (Wave 3b UI item 2 — the client's
       *  on-clock projection input); null in the pre-draft zero-pick state. */
      draftOrder: DraftOrderMeta | null
    }
  /** Sync failed — the flag stays on (Nick's decision); polling will retry. */
  | { status: 'failure'; message: string }
  /** Non-Sleeper league — no Sleeper sync applies (03c extends this). */
  | { status: 'skipped_non_sleeper' }

export type ActivateDraftSessionResult =
  | {
      outcome: 'activated'
      session: DraftSessionState
      initialSync: DraftPollSyncOutcome
    }
  | DraftSessionValidationError

export type ActiveDraftPollResult =
  /** The flag was effectively active — one poll ran and was recorded. */
  | { outcome: 'polled'; sync: DraftPollSyncOutcome; session: DraftSessionState }
  /**
   * The flag is off or TTL-lapsed — no Sleeper request is made and nothing is
   * recorded (a declined tick is not a poll run). The session state tells the
   * client ticker to stand down.
   */
  | { outcome: 'inactive'; session: DraftSessionState }
  | DraftSessionValidationError

export type DeactivateDraftSessionResult =
  | { outcome: 'deactivated'; session: DraftSessionState }
  | DraftSessionValidationError

/**
 * Read a league's draft-session state with the soft TTL applied. A league
 * with no `draft_sessions` row has simply never had a session — a valid
 * inactive state, not an error.
 */
export async function getDraftSessionState(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<DraftSessionStateResult> {
  const invalid = await ensureLeagueExists(db, leagueId)
  if (invalid !== null) return invalid

  const { data: row, error } = await db
    .from('draft_sessions')
    .select('league_id, is_draft_active, activated_at, deactivated_at')
    .eq('league_id', leagueId)
    .maybeSingle()
  if (error) {
    throw new Error(`draft-session read failed: ${error.message}`)
  }
  return { outcome: 'ok', session: toSessionState(leagueId, row) }
}

/**
 * Turn the flag on (upsert — first activation creates the row), resetting the
 * TTL clock, then run one inline draft-state sync so the board starts
 * current. The sync is best-effort by decision: its failure is reported in
 * the result and recorded in `sync_runs`, but the activation stands.
 */
export async function activateDraftSession(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<ActivateDraftSessionResult> {
  const league = await fetchLeague(db, leagueId)
  if (league === null) {
    return leagueNotFound()
  }

  const { data: row, error } = await db
    .from('draft_sessions')
    .upsert(
      {
        league_id: leagueId,
        is_draft_active: true,
        activated_at: new Date().toISOString(),
      },
      { onConflict: 'league_id' }
    )
    .select('league_id, is_draft_active, activated_at, deactivated_at')
    .single()
  if (error) {
    throw new Error(`draft-session activate failed: ${error.message}`)
  }

  const initialSync = await runRecordedDraftPoll(db, league)
  return {
    outcome: 'activated',
    session: toSessionState(leagueId, row),
    initialSync,
  }
}

/**
 * One elevated-cadence poll tick (Wave 3b orchestration items 2+3): the
 * server side of the client-driven trigger (Nick's Clarify decision — Hobby
 * crons are daily-only, so the open admin board drives the ~5s cadence while
 * the draft is live). The active check is authoritative HERE, TTL-aware —
 * a stale tab can tick forever and never cause a Sleeper request. Every poll
 * that actually runs is recorded in `sync_runs` (Nick-signed: every run, as
 * specced — a few thousand small rows per draft day is accepted fidelity).
 *
 * Normal-cadence fallback is the existing daily league-state cron chain
 * (orchestrator's draft step) — nothing extra runs when no draft is live.
 */
export async function runActiveDraftPoll(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<ActiveDraftPollResult> {
  const league = await fetchLeague(db, leagueId)
  if (league === null) return leagueNotFound()

  const { data: row, error } = await db
    .from('draft_sessions')
    .select('league_id, is_draft_active, activated_at, deactivated_at')
    .eq('league_id', leagueId)
    .maybeSingle()
  if (error) {
    throw new Error(`draft-poll session read failed: ${error.message}`)
  }
  const session = toSessionState(leagueId, row)
  if (!session.isDraftActive) return { outcome: 'inactive', session }

  const sync = await runRecordedDraftPoll(db, league)
  return { outcome: 'polled', sync, session }
}

/**
 * Turn the flag off. A league with no session row is already inactive —
 * deactivation is idempotent and reports the (inactive) state either way.
 */
export async function deactivateDraftSession(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<DeactivateDraftSessionResult> {
  const invalid = await ensureLeagueExists(db, leagueId)
  if (invalid !== null) return invalid

  const { data: rows, error } = await db
    .from('draft_sessions')
    .update({
      is_draft_active: false,
      deactivated_at: new Date().toISOString(),
    })
    .eq('league_id', leagueId)
    .select('league_id, is_draft_active, activated_at, deactivated_at')
  if (error) {
    throw new Error(`draft-session deactivate failed: ${error.message}`)
  }
  return {
    outcome: 'deactivated',
    session: toSessionState(leagueId, rows[0] ?? null),
  }
}

type SessionRow = {
  league_id: string
  is_draft_active: boolean
  activated_at: string | null
  deactivated_at: string | null
}

/** Apply the read-time soft TTL to a stored row (or its absence). */
function toSessionState(
  leagueId: string,
  row: SessionRow | null
): DraftSessionState {
  if (row === null) {
    return {
      leagueId,
      isDraftActive: false,
      isStale: false,
      activatedAt: null,
      deactivatedAt: null,
    }
  }
  const withinTtl =
    row.activated_at !== null &&
    Date.now() - new Date(row.activated_at).getTime() <
      DRAFT_ACTIVE_TTL_HOURS * 60 * 60 * 1000
  const effective = row.is_draft_active && withinTtl
  return {
    leagueId,
    isDraftActive: effective,
    isStale: row.is_draft_active && !effective,
    activatedAt: row.activated_at,
    deactivatedAt: row.deactivated_at,
  }
}

type LeagueRow = {
  platform_league_uuid: string
  platform: Database['public']['Enums']['platform']
  native_league_id: string
}

/**
 * One recorded draft poll — shared by the activation-time sync and every
 * elevated tick: Sleeper leagues only (the ESPN poll path is 03c scope),
 * recorded in `sync_runs` as a `draft_poll` run exactly like the scheduled
 * path — tracking is best-effort and never masks the sync outcome.
 */
async function runRecordedDraftPoll(
  db: SupabaseClient<Database>,
  league: LeagueRow
): Promise<DraftPollSyncOutcome> {
  if (league.platform !== 'sleeper') return { status: 'skipped_non_sleeper' }

  const startedAt = new Date().toISOString()
  try {
    const result = await syncLeagueDraftState(db, league.native_league_id)
    await recordSyncRunSafely(db, {
      source: 'draft_poll',
      platform: 'sleeper',
      leagueId: result.leagueUuid,
      status: 'success',
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      counts: {
        picks_fetched: result.picksFetched,
        picks_written: result.picksWritten,
        picks_already_recorded: result.picksAlreadyRecorded,
      },
    })
    return {
      status: 'success',
      picksFetched: result.picksFetched,
      picksWritten: result.picksWritten,
      picksAlreadyRecorded: result.picksAlreadyRecorded,
      draftOrder: result.draftOrder,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await recordSyncRunSafely(db, {
      source: 'draft_poll',
      platform: 'sleeper',
      leagueId: league.platform_league_uuid,
      status: 'failure',
      startedAt,
      completedAt: new Date().toISOString(),
      errorSummary: `draft poll: ${message}`,
    })
    return { status: 'failure', message }
  }
}

async function fetchLeague(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<LeagueRow | null> {
  // Malformed IDs are not-found by definition (draft-board precedent).
  if (!UUID_PATTERN.test(leagueId)) return null
  const { data, error } = await db
    .from('leagues')
    .select('platform_league_uuid, platform, native_league_id')
    .eq('platform_league_uuid', leagueId)
    .maybeSingle()
  if (error) {
    throw new Error(`draft-session league query failed: ${error.message}`)
  }
  return data
}

async function ensureLeagueExists(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<DraftSessionValidationError | null> {
  const league = await fetchLeague(db, leagueId)
  return league === null ? leagueNotFound() : null
}

function leagueNotFound(): DraftSessionValidationError {
  return {
    outcome: 'validation_error',
    reason: 'league_not_found',
    message: 'Unknown league.',
  }
}
