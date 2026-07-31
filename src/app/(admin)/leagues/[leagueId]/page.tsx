import { notFound } from 'next/navigation'

import CommandCenterHome from '@/components/dashboard/command-center'
import { createClient } from '@/lib/supabase/server'
import {
  firstContext,
  getPowerRankings,
  getStandings,
  SECTION_UNAVAILABLE,
  settleQuery,
  toSection,
} from '@/services/dashboard'

/**
 * Admin command-center home (Wave 4 nav-shell sub-section) — the league root,
 * and where root auto-land now lands (Nick-signed: the full standings/matchups
 * dashboard moved to /dashboard). Server Component reading through the RLS
 * server client as the signed-in admin. Composes the same standings and power
 * results the full dashboard renders into lightweight snapshot cards that
 * deep-link into their full pages — no second ordering or formula. The
 * segment layout already 404s an unknown league; the getters guard again so a
 * genuinely inaccessible league is a clean not-found, never a partial page.
 *
 * Failure isolation (Nick's Clarify, 2026-07-31): a snapshot query that throws
 * degrades to that card alone — the other cards and the draft-board deep-link
 * stay usable. Only a league that is genuinely not found 404s, and only both
 * snapshots failing (nothing left to title the page with) reaches the route
 * error boundary.
 */
export default async function LeagueHomePage({
  params,
}: {
  params: Promise<{ leagueId: string }>
}) {
  const { leagueId } = await params
  const db = await createClient()

  const [standingsResult, powerRankingsResult] = await Promise.all([
    settleQuery('standings', getStandings(db, leagueId), SECTION_UNAVAILABLE),
    settleQuery(
      'powerRankings',
      getPowerRankings(db, leagueId),
      SECTION_UNAVAILABLE
    ),
  ])
  if (
    (!standingsResult.ok && standingsResult.reason === 'league_not_found') ||
    (!powerRankingsResult.ok &&
      powerRankingsResult.reason === 'league_not_found')
  ) {
    notFound()
  }

  const standings = toSection(standingsResult)
  const powerRankings = toSection(powerRankingsResult)
  const context = firstContext([standings, powerRankings])
  // Both snapshots failed: there is no league identity to render a header
  // with, so this is a whole-page failure — hand it to the route error
  // boundary rather than rendering a nameless shell of empty cards.
  if (context === null) throw new Error('command center: all sections failed')

  return (
    <CommandCenterHome
      leagueId={leagueId}
      context={context}
      standings={standings}
      powerRankings={powerRankings}
    />
  )
}
