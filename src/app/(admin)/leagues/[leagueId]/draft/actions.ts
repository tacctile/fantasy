'use server'

import { revalidatePath } from 'next/cache'

import { getAdminAuthState } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import {
  recordManualPick,
  undoLastManualPick,
  type ManualPickInput,
  type ManualPickResult,
  type UndoManualPickResult,
} from '@/services/draft-picks'
import {
  activateDraftSession,
  deactivateDraftSession,
  runActiveDraftPoll,
  type ActivateDraftSessionResult,
  type ActiveDraftPollResult,
  type DeactivateDraftSessionResult,
} from '@/services/draft-sessions'

/**
 * Server actions for the manual click-to-draft write path (Wave 3b). Admin
 * surface only: server actions are POST endpoints, so the auth gate lives
 * INSIDE each action — the (admin) layout gate protects pages, not action
 * invocations. Non-admin callers (unauthenticated, or a signed-in
 * non-fantasy prolabel user) get a typed `unauthorized` with zero data; RLS
 * (`fantasy_owner_all`, deny-by-default) is the second wall behind it. The
 * spectator/share-token surface never imports from the admin route tree, and
 * these actions are additionally unusable from it by both walls.
 *
 * Writes go through the RLS server client as the signed-in admin — never the
 * secret-key admin client (owner surfaces read and write through RLS by
 * established rule).
 */

export type ManualPickActionResult = ManualPickResult | { outcome: 'unauthorized' }
export type UndoManualPickActionResult =
  | UndoManualPickResult
  | { outcome: 'unauthorized' }

export async function submitManualPick(
  input: ManualPickInput
): Promise<ManualPickActionResult> {
  const db = await createClient()
  const auth = await getAdminAuthState(db)
  if (auth.state !== 'admin') return { outcome: 'unauthorized' }

  const result = await recordManualPick(db, input)
  if (result.outcome === 'accepted') {
    revalidatePath(`/leagues/${input.leagueId}/draft`)
  }
  return result
}

export async function undoManualPick(
  leagueId: string
): Promise<UndoManualPickActionResult> {
  const db = await createClient()
  const auth = await getAdminAuthState(db)
  if (auth.state !== 'admin') return { outcome: 'unauthorized' }

  const result = await undoLastManualPick(db, leagueId)
  if (result.outcome === 'undone') {
    revalidatePath(`/leagues/${leagueId}/draft`)
  }
  return result
}

export type StartDraftSessionActionResult =
  | ActivateDraftSessionResult
  | { outcome: 'unauthorized' }
export type EndDraftSessionActionResult =
  | DeactivateDraftSessionResult
  | { outcome: 'unauthorized' }

/**
 * Toggle the league's draft session ACTIVE (Wave 3b orchestration item 1) —
 * the toolbar control Nick hits at the real start of a live draft. Runs the
 * activation-time inline draft-state sync (Nick's Clarify decision) whose
 * failure never rolls back the flag.
 */
export async function startDraftSession(
  leagueId: string
): Promise<StartDraftSessionActionResult> {
  const db = await createClient()
  const auth = await getAdminAuthState(db)
  if (auth.state !== 'admin') return { outcome: 'unauthorized' }

  const result = await activateDraftSession(db, leagueId)
  if (result.outcome === 'activated') {
    revalidatePath(`/leagues/${leagueId}/draft`)
  }
  return result
}

/** Toggle the league's draft session INACTIVE — idempotent stop. */
export async function endDraftSession(
  leagueId: string
): Promise<EndDraftSessionActionResult> {
  const db = await createClient()
  const auth = await getAdminAuthState(db)
  if (auth.state !== 'admin') return { outcome: 'unauthorized' }

  const result = await deactivateDraftSession(db, leagueId)
  if (result.outcome === 'deactivated') {
    revalidatePath(`/leagues/${leagueId}/draft`)
  }
  return result
}

export type PollActiveDraftActionResult =
  | ActiveDraftPollResult
  | { outcome: 'unauthorized' }

/**
 * One elevated poll tick (Wave 3b orchestration items 2+3), invoked by the
 * board's interval ticker while the draft session is live. The service
 * re-checks `is_draft_active` (TTL-aware) authoritatively before any Sleeper
 * request, so a stale client can never force polling; every poll that runs is
 * recorded in `sync_runs`. Revalidates the board only when new picks landed.
 */
export async function pollActiveDraft(
  leagueId: string
): Promise<PollActiveDraftActionResult> {
  const db = await createClient()
  const auth = await getAdminAuthState(db)
  if (auth.state !== 'admin') return { outcome: 'unauthorized' }

  const result = await runActiveDraftPoll(db, leagueId)
  if (
    result.outcome === 'polled' &&
    result.sync.status === 'success' &&
    result.sync.picksWritten > 0
  ) {
    revalidatePath(`/leagues/${leagueId}/draft`)
  }
  return result
}
