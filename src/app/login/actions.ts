'use server'

import { redirect } from 'next/navigation'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'
import { listConnectedLeagues } from '@/services/draft-board'

export type SignInState = { error: string } | null

/**
 * Post-sign-in landing (Nick-signed): straight to the first connected
 * league's draft board, no interstitial. With zero leagues (or a non-admin
 * session, whose RLS-filtered league list is empty) this falls back to the
 * root page, which renders the appropriate state.
 */
async function landingPath(db: SupabaseClient<Database>): Promise<string> {
  const leagues = await listConnectedLeagues(db)
  return leagues.length > 0 ? `/leagues/${leagues[0].leagueId}/draft` : '/'
}

export async function signIn(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = formData.get('email')
  const password = formData.get('password')
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    email === '' ||
    password === ''
  ) {
    return { error: 'Email and password are required.' }
  }

  const db = await createClient()
  const { error } = await db.auth.signInWithPassword({ email, password })
  if (error) {
    // One generic message — never echo provider internals to the page.
    return { error: 'Sign-in failed — check email and password.' }
  }
  redirect(await landingPath(db))
}

export async function signOut(): Promise<void> {
  const db = await createClient()
  await db.auth.signOut()
  redirect('/login')
}
