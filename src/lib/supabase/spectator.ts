import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

/**
 * Anonymous, session-less Supabase client for the read-only spectator surface
 * (Wave 4 named-singleton #5). Uses the publishable (anon-role) key with the
 * league's `share_token` presented as the `x-share-token` request header — the
 * exact transport the spectator RLS policies read via
 * `public.current_share_token()`.
 *
 * RLS is the data-exposure boundary, not this code: a client built here can
 * only ever read the rows the presented token unlocks (that one league's
 * standings/matchups/power/player data + the global player catalog), and can
 * never reach `draft_state`/`draft_sessions` — those carry no spectator policy,
 * so they stay deny-by-default to the anon role even with a valid token.
 *
 * Server-only. The spectator data loader (`services/spectator.ts`) is the sole
 * caller. Never carries a user session, never uses the secret admin key.
 * Follows the `lib/supabase/` convention: exported as `createClient`,
 * disambiguated by import path (`@/lib/supabase/spectator`).
 */
export function createClient(shareToken: string) {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { 'x-share-token': shareToken } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}
