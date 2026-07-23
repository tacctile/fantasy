import { notFound } from 'next/navigation'

import AdminSidebar from '@/components/dashboard/admin-sidebar'
import { createClient } from '@/lib/supabase/server'
import { listConnectedLeagues } from '@/services/draft-board'

/**
 * Persistent admin shell for one league (Wave 4 nav-shell sub-section). This
 * layout — not the pages — owns the sidebar, so it renders once and stays
 * mounted as the child page swaps between Home / Dashboard / Draft (the sticky
 * league context: no re-selecting the league when moving sections). It reads
 * the connected-league list once here, past the (admin) auth gate, and 404s an
 * unknown/inaccessible league id up front (the same typed not-found the pages
 * already resolve — one wall, not two divergent ones). Everything under
 * /leagues/[leagueId] mounts into this frame, including Wave 5/6 sections.
 */
export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ leagueId: string }>
}) {
  const { leagueId } = await params
  const db = await createClient()
  const leagues = await listConnectedLeagues(db)
  const active = leagues.find((league) => league.leagueId === leagueId)
  if (active === undefined) notFound()

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <AdminSidebar leagues={leagues} activeLeagueId={leagueId} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
