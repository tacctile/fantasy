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
