import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"

/**
 * Supabase admin client for trusted server-only usage (route handlers, jobs).
 * Uses the secret key and bypasses RLS — never import from client code.
 */
export function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
