import { notFound } from 'next/navigation'

import SectionUnavailable from '@/components/dashboard/section-unavailable'
import PositionalShell from '@/components/positional/positional-shell'
import { createClient } from '@/lib/supabase/server'
import { settleQuery } from '@/services/dashboard'
import { getLeagueContext } from '@/services/league-context'
import { getPositionalBreakdown } from '@/services/positional'

/**
 * Admin Positional Breakdowns section (Wave 5 — Positional breakdowns).
 *
 * Its own route at `/leagues/[leagueId]/positional`, lighting the `Positional`
 * slot the Wave 4 nav shell reserved — the pattern Score Trends and the Luck
 * Tracker already followed. The Integration sub-section's remaining items
 * (command-center summary card, cross-feature links) are untouched by this fold.
 *
 * Server Component through the RLS server client, as the signed-in admin. The
 * whole section renders with zero client JavaScript: the chart primitives are
 * percentage-positioned CSS, and BOTH selections — the focused team and the
 * heatmap's sort column — are URL parameters rather than component state, so a
 * sorted, team-focused view is shareable and survives a reload.
 *
 * The league's slot layout is resolved ONCE here, by `getLeagueContext`, and
 * passed into the aggregation — the section never re-reads `league_config` for
 * a shape the mandated resolver already parsed.
 *
 * Failure isolation follows the Wave 4 resilience pattern: an unknown league is
 * a clean 404 and the header survives regardless, while the breakdown query is
 * settled independently — a fault renders the section notice instead of taking
 * the page to the route error boundary.
 */
export default async function PositionalPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueId: string }>
  searchParams: Promise<{ team?: string; sort?: string }>
}) {
  const { leagueId } = await params
  const { team, sort } = await searchParams
  const db = await createClient()

  const contextResult = await getLeagueContext(db, leagueId)
  if (!contextResult.ok) notFound()

  const data = await settleQuery(
    'positional',
    getPositionalBreakdown(db, leagueId, contextResult.data.slotLayout),
    null
  )

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
          <span className="text-sm text-muted-foreground">
            Positional breakdown
          </span>
        </header>
        <main className="flex flex-1 flex-col p-4">
          <SectionUnavailable label="Positional breakdown" />
        </main>
      </div>
    )
  }

  return (
    <PositionalShell
      context={contextResult.data}
      data={data}
      basePath={`/leagues/${leagueId}/positional`}
      selectedRosterId={parseRosterId(team)}
      sortKey={parseSortKey(sort, data.buckets.map((bucket) => bucket.key))}
    />
  )
}

/**
 * The team selection from the URL. An unparseable or unknown value falls back
 * to the whole-league view rather than 404ing — a stale link to a team that has
 * since left the league should still show the section.
 */
function parseRosterId(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const value = Number(raw)
  return Number.isInteger(value) ? value : null
}

/**
 * The sort column from the URL, accepted only when it names a real bucket in
 * THIS league — so a hand-edited or stale parameter falls back to the default
 * ordering instead of producing an all-zero sort that looks like missing data.
 */
function parseSortKey(
  raw: string | undefined,
  bucketKeys: readonly string[]
): string | null {
  if (raw === undefined) return null
  return bucketKeys.includes(raw) ? raw : null
}
