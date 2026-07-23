'use server'

import { revalidatePath } from 'next/cache'

import { getAdminAuthState } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Owner-only server action for the share-link settings panel (Wave 4
 * named-singleton #5). Regenerating a token invalidates the previous spectator
 * link and issues a fresh one atomically (revoke == regenerate; share_token is
 * NOT NULL, so there is no "sharing off" state — a leaked link is killed by
 * minting a new one). MASTER_CONTEXT Access Model: revocable/regeneratable per
 * league without recreating the league.
 *
 * Admin surface only: server actions are POST endpoints, so the auth gate lives
 * INSIDE the action (the (admin) layout gate protects pages, not action
 * invocations). Non-admin callers get a typed `unauthorized` with no token.
 * The write runs through the RLS server client as the signed-in admin and the
 * `regenerate_share_token` RPC (SECURITY INVOKER) — the admin's own RLS UPDATE
 * policy is the second wall, so a non-admin who somehow reached the RPC updates
 * zero rows and gets `not_found` back. Never the secret admin client.
 */

export type RegenerateShareTokenResult =
  | { outcome: 'regenerated'; shareToken: string }
  | { outcome: 'unauthorized' }
  | { outcome: 'not_found' }

export async function regenerateShareToken(
  leagueId: string
): Promise<RegenerateShareTokenResult> {
  const db = await createClient()
  const auth = await getAdminAuthState(db)
  if (auth.state !== 'admin') return { outcome: 'unauthorized' }

  const { data, error } = await db.rpc('regenerate_share_token', {
    p_league_id: leagueId,
  })
  if (error) {
    throw new Error(`share-token regeneration failed: ${error.message}`)
  }
  // Null = no league row updated (unknown/inaccessible league): honest
  // not-found, never a partial success.
  if (data === null) return { outcome: 'not_found' }

  revalidatePath(`/leagues/${leagueId}/dashboard`)
  return { outcome: 'regenerated', shareToken: data }
}
