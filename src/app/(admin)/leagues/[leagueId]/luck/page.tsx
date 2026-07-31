import { notFound } from 'next/navigation'

import SectionUnavailable from '@/components/dashboard/section-unavailable'
import LuckShell from '@/components/luck/luck-shell'
import { createClient } from '@/lib/supabase/server'
import { settleQuery } from '@/services/dashboard'
import { getLeagueContext } from '@/services/league-context'
import { getLuck } from '@/services/luck'

/**
 * Admin Luck Tracker section (Wave 5 — Lucky/unlucky tracker).
 *
 * Its own route at `/leagues/[leagueId]/luck` (Nick's Clarify, 2026-07-31),
 * lighting the `Luck Tracker` slot the Wave 4 nav shell reserved — the same
 * pattern Score Trends followed, rather than a block appended to /dashboard.
 * The Integration sub-section's remaining items (command-center summary card,
 * cross-feature links, spectator wiring) are untouched by this fold.
 *
 * Server Component through the RLS server client, as the signed-in admin. The
 * whole section renders with zero client JavaScript: the chart primitives are
 * percentage-positioned CSS/SVG, and the drill-down is a URL parameter rather
 * than component state.
 *
 * Failure isolation follows the Wave 4 resilience pattern: league identity
 * resolves through `getLeagueContext` so an unknown league is a clean 404 and
 * the header survives regardless, while the luck query is settled independently
 * — a fault renders the section notice instead of taking the page to the route
 * error boundary.
 */
export default async function LuckPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueId: string }>
  searchParams: Promise<{ team?: string }>
}) {
  const { leagueId } = await params
  const { team } = await searchParams
  const db = await createClient()

  const contextResult = await getLeagueContext(db, leagueId)
  if (!contextResult.ok) notFound()

  const data = await settleQuery('luck', getLuck(db, leagueId), null)

  if (data === null) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">
            {contextResult.data.name ?? 'League'}
          </h1>
          <span className="text-sm text-muted-foreground tabular-nums">
            {contextResult.data.seasonYear}
          </span>
          <span className="text-sm text-muted-foreground">Luck tracker</span>
        </header>
        <main className="flex flex-1 flex-col p-4">
          <SectionUnavailable label="Luck tracker" />
        </main>
      </div>
    )
  }

  return (
    <LuckShell
      context={contextResult.data}
      data={data}
      basePath={`/leagues/${leagueId}/luck`}
      selectedRosterId={parseRosterId(team)}
    />
  )
}

/**
 * The drill-down selection from the URL. An unparseable or unknown value falls
 * back to the whole-league view rather than 404ing — a stale link to a team
 * that has since left the league should still show the section.
 */
function parseRosterId(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const value = Number(raw)
  return Number.isInteger(value) ? value : null
}
