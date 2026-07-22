import { redirect } from 'next/navigation'

import NotAuthorizedCard from '@/components/auth/not-authorized-card'
import { getAdminAuthState } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Gate for the owner working-tool surface (Access Model, MASTER_CONTEXT.md).
 * Unauthenticated → /login (the proxy enforces this per-request too);
 * authenticated non-admin (the auth namespace is shared with Nick's other
 * prolabel apps) → not-authorized view, children never render. Per-table RLS
 * pinned to the admin's auth.uid() is the wall behind both. This route group
 * is never reused by the spectator share-link surface — that is a separate
 * rendering path built in Wave 4.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const db = await createClient()
  const auth = await getAdminAuthState(db)
  if (auth.state === 'unauthenticated') redirect('/login')
  if (auth.state === 'not_admin') return <NotAuthorizedCard email={auth.email} />
  return <>{children}</>
}
