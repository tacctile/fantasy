import { notFound } from 'next/navigation'

import SectionUnavailable from '@/components/dashboard/section-unavailable'
import PlayoffShell from '@/components/playoff/playoff-shell'
import { createClient } from '@/lib/supabase/server'
import { settleQuery } from '@/services/dashboard'
import { getLeagueContext } from '@/services/league-context'
import { getPlayoffPicture } from '@/services/playoff-picture'

/**
 * Admin Playoff Picture section (Wave 5 — Playoff picture, item 4).
 *
 * Its own route at `/leagues/[leagueId]/playoff-picture`, lighting the
 * `Playoff Picture` slot the Wave 4 nav shell reserved — the same pattern Score
 * Trends, the Luck Tracker, and Positional Breakdowns already followed. The
 * Integration sub-section's remaining items (command-center summary card,
 * cross-feature links) are untouched by this fold.
 *
 * Server Component through the RLS server client, as the signed-in admin. The
 * section renders with zero client JavaScript: it is a table, and its one
 * selection — the focused team — is a URL parameter rather than component
 * state, so a focused view is shareable and survives a reload.
 *
 * Failure isolation follows the Wave 4 resilience pattern: an unknown league is
 * a clean 404, while the picture query is settled independently so a fault
 * renders the section notice instead of taking the page to the route error
 * boundary.
 */
export default async function PlayoffPicturePage({
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

  const data = await settleQuery('playoff-picture', getPlayoffPicture(db, leagueId), null)

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
          <span className="text-sm text-muted-foreground">Playoff picture</span>
        </header>
        <main className="flex flex-1 flex-col p-4">
          <SectionUnavailable label="Playoff picture" />
        </main>
      </div>
    )
  }

  return (
    <PlayoffShell
      context={contextResult.data}
      data={data}
      basePath={`/leagues/${leagueId}/playoff-picture`}
      selectedRosterId={parseRosterId(team)}
    />
  )
}

/**
 * The focused team from the URL. An unparseable value falls back to no focus
 * rather than 404ing — a stale link to a team that has since left the league
 * should still show the section.
 */
function parseRosterId(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const value = Number(raw)
  return Number.isInteger(value) ? value : null
}
