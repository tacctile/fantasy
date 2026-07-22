import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

/**
 * Admin auth state for the owner (working-tool) surface. Being signed in is
 * NOT enough — the auth namespace is shared with Nick's other prolabel apps,
 * so a valid session may belong to a non-fantasy user. `public.is_fantasy_admin()`
 * is the single source of truth, called via RPC so rotating the admin stays a
 * one-line database change (never app code, never a hardcoded UUID here).
 */
export type AdminAuthState =
  | { state: 'unauthenticated' }
  | { state: 'not_admin'; email: string | null }
  | { state: 'admin'; email: string | null }

export async function getAdminAuthState(
  db: SupabaseClient<Database>
): Promise<AdminAuthState> {
  const {
    data: { user },
  } = await db.auth.getUser()
  if (user === null) return { state: 'unauthenticated' }

  const { data: isAdmin, error } = await db.rpc('is_fantasy_admin')
  if (error) throw new Error(`fantasy admin check failed: ${error.message}`)
  return isAdmin === true
    ? { state: 'admin', email: user.email ?? null }
    : { state: 'not_admin', email: user.email ?? null }
}
