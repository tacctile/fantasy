import { LayoutDashboard } from 'lucide-react'
import { redirect } from 'next/navigation'

import NotAuthorizedCard from '@/components/auth/not-authorized-card'
import { getAdminAuthState } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { listConnectedLeagues } from '@/services/draft-board'

/**
 * Root router for the owner surface (Nick-signed auto-land): unauthenticated
 * → /login; admin with leagues → first connected league's draft board; admin
 * with none → a minimal empty note (league sync is how leagues appear, per
 * Wave 2's runners); non-admin session → not-authorized. Wave 4's
 * command-center home replaces the empty note when it lands.
 */
export default async function Home() {
  const db = await createClient()
  const auth = await getAdminAuthState(db)
  if (auth.state === 'unauthenticated') redirect('/login')
  if (auth.state === 'not_admin') return <NotAuthorizedCard email={auth.email} />

  const leagues = await listConnectedLeagues(db)
  if (leagues.length > 0) redirect(`/leagues/${leagues[0].leagueId}/draft`)

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-background p-8 text-foreground">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="size-6 text-muted-foreground" aria-hidden />
        <h1 className="text-2xl font-semibold tracking-tight">fantasy</h1>
      </div>
      <p className="max-w-md text-center text-muted-foreground">
        No leagues connected yet. Run a league sync (npm run sync:league --
        &lt;league_id&gt;) and this will route straight to its draft board.
      </p>
    </main>
  )
}
