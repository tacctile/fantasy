import Link from 'next/link'

import ChartEmpty from '@/components/charts/chart-empty'
import { formatPoints } from '@/components/charts/format'
import { divergingVar, tokenColor } from '@/components/charts/series'
import { teamLabel } from '@/components/score-trends/team-label'
import { cn } from '@/lib/utils'
import type {
  PositionalBreakdownData,
  PositionalTeam,
} from '@/services/positional'

import { bucketShortLabel, positionalWeekNote } from './positional-notes'

interface PositionalHeatmapProps {
  data: PositionalBreakdownData
  basePath: string
  /** The bucket key the grid is currently ordered by; null = total points. */
  sortKey: string | null
  /** The focused team — pinned to the top row and highlighted. */
  selectedRosterId: number | null
}

/**
 * Every team against every position at once (Wave 5 — Positional breakdowns,
 * item 3): a teams × positions grid, cells coloured by percentile.
 *
 * A heatmap rather than a multi-series chart because the comparison is
 * two-dimensional — ten teams across eight slots is eighty values, which no
 * line or bar chart carries without becoming the spaghetti the wave's
 * anti-pattern note rejects outright.
 *
 * COLOUR IS PERCENTILE, DIVERGING ABOUT THE LEAGUE MIDDLE, because that is the
 * only encoding that survives comparing a QB column with a K column: raw points
 * differ by an order of magnitude between positions, so a raw-value ramp would
 * render the whole DEF column dark and say nothing about anyone. The number
 * printed in each cell is still the real points total — colour ranks, text
 * measures, and a reader who ignores colour entirely loses nothing.
 *
 * SORTING IS A LINK, NOT STATE (Nick's Clarify, 2026-07-31): each column header
 * is a URL, so the grid re-sorts server-side and the section keeps the wave's
 * zero-client-JavaScript guarantee. A sorted view is then also shareable and
 * survives a reload, which component state would not be.
 *
 * The selected team is PINNED to the first row and highlighted, so a reader
 * comparing their own team against the league never has to hunt for it after a
 * re-sort — the item's explicit requirement.
 */
export default function PositionalHeatmap({
  data,
  basePath,
  sortKey,
  selectedRosterId,
}: PositionalHeatmapProps) {
  const buckets = data.buckets

  if (buckets.length === 0 || data.weeksCounted === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">League positional grid</h3>
        <ChartEmpty message="No weeks have been scored in this league yet — there is nothing to rank." />
      </section>
    )
  }

  const rows = orderTeams(data, sortKey, selectedRosterId)

  return (
    <section className="flex flex-col gap-3 tabular-nums">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold">League positional grid</h3>
        <p className="text-xs text-muted-foreground">
          {positionalWeekNote(data)}
        </p>
      </div>

      {/* Wide content scrolls inside its own container — the page body never
          scrolls sideways, however many slots a league carries. */}
      <div className="overflow-x-auto rounded-xl bg-card">
        <table className="w-full min-w-max border-collapse text-sm">
          <caption className="sr-only">
            Started points by team and lineup slot, cells shaded by league
            percentile. Column headers re-sort the table.
          </caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium">
                <SortLink
                  basePath={basePath}
                  bucketKey={null}
                  sortKey={sortKey}
                  selectedRosterId={selectedRosterId}
                  label="Team"
                />
              </th>
              {buckets.map((bucket) => (
                <th
                  key={bucket.key}
                  scope="col"
                  className="px-2 py-2 text-right text-xs font-medium"
                >
                  <SortLink
                    basePath={basePath}
                    bucketKey={bucket.key}
                    sortKey={sortKey}
                    selectedRosterId={selectedRosterId}
                    label={bucketShortLabel(bucket)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((team) => {
              const isSelected = team.nativeRosterId === selectedRosterId
              return (
                <tr
                  key={team.nativeRosterId}
                  className={cn('border-b last:border-b-0', isSelected && 'bg-muted')}
                >
                  <th
                    scope="row"
                    className="max-w-[10rem] truncate px-3 py-2 text-left font-medium"
                  >
                    <Link
                      href={teamHref(basePath, team.nativeRosterId, sortKey, isSelected)}
                      aria-current={isSelected ? 'true' : undefined}
                      className="underline-offset-4 hover:underline"
                    >
                      {teamLabel(team)}
                    </Link>
                  </th>
                  {buckets.map((bucket) => {
                    const slot = team.buckets.find(
                      (entry) => entry.key === bucket.key
                    )
                    if (slot === undefined) return <td key={bucket.key} />
                    return (
                      <td key={bucket.key} className="p-0">
                        <span className="relative flex justify-end px-2 py-2">
                          <span
                            aria-hidden
                            className="absolute inset-0.5 rounded-sm"
                            style={fillStyle(slot.percentile)}
                          />
                          <span className="relative">
                            {formatPoints(slot.points, 0)}
                          </span>
                          <span className="sr-only">
                            {' '}
                            points, rank {slot.rank} of {data.teams.length}
                          </span>
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Shading is the team&apos;s rank within that column — stronger green is
        higher in the league, stronger red is lower. Numbers are started points.
      </p>
    </section>
  )
}

/**
 * Row order: the selected team first (pinned), then the requested column
 * descending, then the service's own total-points order as the stable base.
 * Ties fall back to roster id so a re-sort is deterministic rather than
 * dependent on the previous ordering.
 */
function orderTeams(
  data: PositionalBreakdownData,
  sortKey: string | null,
  selectedRosterId: number | null
): PositionalTeam[] {
  const sorted =
    sortKey === null
      ? [...data.teams]
      : [...data.teams].sort((a, b) => {
          const aPoints = a.buckets.find((slot) => slot.key === sortKey)?.points ?? 0
          const bPoints = b.buckets.find((slot) => slot.key === sortKey)?.points ?? 0
          if (aPoints !== bPoints) return bPoints - aPoints
          return a.nativeRosterId - b.nativeRosterId
        })

  if (selectedRosterId === null) return sorted
  const selected = sorted.filter((team) => team.nativeRosterId === selectedRosterId)
  if (selected.length === 0) return sorted
  return [...selected, ...sorted.filter((team) => team.nativeRosterId !== selectedRosterId)]
}

/**
 * A cell's shading: the diverging token at an opacity set by how far the team
 * sits from the middle of the column. Opacity rather than a generated colour
 * keeps this to the two sanctioned tokens with zero inline hex, and keeps the
 * printed number legible at every intensity. A null percentile (a one-team
 * league) shades nothing rather than claiming a rank that doesn't exist.
 */
function fillStyle(percentile: number | null): {
  backgroundColor: string
  opacity: number
} {
  if (percentile === null) {
    return { backgroundColor: tokenColor(divergingVar('zero')), opacity: 0.08 }
  }
  const distance = Math.abs(percentile - 50) / 50
  return {
    backgroundColor: tokenColor(
      divergingVar(percentile >= 50 ? 'positive' : 'negative')
    ),
    // Floor of 0.08 so a mid-table cell still reads as a cell, ceiling of 0.55
    // so the number on top never loses contrast against it.
    opacity: 0.08 + distance * 0.47,
  }
}

/** A column header that re-sorts the grid, preserving the selected team. */
function SortLink({
  basePath,
  bucketKey,
  sortKey,
  selectedRosterId,
  label,
}: {
  basePath: string
  bucketKey: string | null
  sortKey: string | null
  selectedRosterId: number | null
  label: string
}) {
  const isActive = bucketKey === sortKey
  const params = new URLSearchParams()
  // Clicking the active column returns to the default total-points order, so a
  // sort is reversible without a second control.
  if (bucketKey !== null && !isActive) params.set('sort', bucketKey)
  if (selectedRosterId !== null) params.set('team', String(selectedRosterId))
  const query = params.toString()

  return (
    <Link
      href={query === '' ? basePath : `${basePath}?${query}`}
      aria-current={isActive ? 'true' : undefined}
      className={cn(
        'underline-offset-4 hover:underline',
        isActive ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {label}
      {isActive && <span aria-hidden> ↓</span>}
      {isActive && <span className="sr-only"> (sorted, click to clear)</span>}
    </Link>
  )
}

/** The team-selection link, preserving the current sort. */
function teamHref(
  basePath: string,
  rosterId: number,
  sortKey: string | null,
  isSelected: boolean
): string {
  const params = new URLSearchParams()
  if (sortKey !== null) params.set('sort', sortKey)
  if (!isSelected) params.set('team', String(rosterId))
  const query = params.toString()
  return query === '' ? basePath : `${basePath}?${query}`
}
