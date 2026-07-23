import { notFound } from 'next/navigation'

import CommandCenterHome from '@/components/dashboard/command-center'
import { createClient } from '@/lib/supabase/server'
import { getPowerRankings, getStandings } from '@/services/dashboard'

/**
 * Admin command-center home (Wave 4 nav-shell sub-section) — the league root,
 * and where root auto-land now lands (Nick-signed: the full standings/matchups
 * dashboard moved to /dashboard). Server Component reading through the RLS
 * server client as the signed-in admin. Composes the same standings and power
 * results the full dashboard renders into lightweight snapshot cards that
 * deep-link into their full pages — no second ordering or formula. The
 * segment layout already 404s an unknown league; the getters guard again so a
 * genuinely inaccessible league is a clean not-found, never a partial page.
 */
export default async function LeagueHomePage({
  params,
}: {
  params: Promise<{ leagueId: string }>
}) {
  const { leagueId } = await params
  const db = await createClient()

  const [standingsResult, powerRankingsResult] = await Promise.all([
    getStandings(db, leagueId),
    getPowerRankings(db, leagueId),
  ])
  if (!standingsResult.ok || !powerRankingsResult.ok) notFound()

  return (
    <CommandCenterHome
      leagueId={leagueId}
      standings={standingsResult.data}
      powerRankings={powerRankingsResult.data}
    />
  )
}
