import ChartEmpty from '@/components/charts/chart-empty'
import { formatPoints } from '@/components/charts/format'
import { teamLabel } from '@/components/score-trends/team-label'
import { cn } from '@/lib/utils'
import type { PositionalBreakdownData } from '@/services/positional'

import { bucketLabel, positionalWeekNote } from './positional-notes'

interface PositionalTableProps {
  data: PositionalBreakdownData
  /** Highlighted row, when a team is selected on the surface. */
  selectedRosterId: number | null
}

/**
 * The positional detail table (Wave 5 — Positional breakdowns, item 4): every
 * team's per-slot total and share of its own started points.
 *
 * The exact figures behind the two charts. The bars say "above average at RB"
 * and the heatmap says "third in the league there"; this says 412.6 points,
 * 24.1% of everything the team started. A reader checking the section against
 * their platform's own numbers comes here, which is why it carries the raw
 * totals rather than any derived index.
 *
 * SHARE IS OF THE TEAM'S OWN STARTED POINTS, not of the league — so a row's
 * shares sum to 100% and describe roster composition, which is the question a
 * per-team table is actually asked. Cross-team comparison is the heatmap's job,
 * one component up.
 *
 * Unmapped is included here (unlike the average-anchored bars, where it has no
 * league-average meaning) precisely so its points are inspectable rather than
 * merely disclosed in prose.
 *
 * `tabular-nums` throughout, per the item and the project-wide data-display
 * convention — inherited from the wrapper rather than repeated per cell.
 */
export default function PositionalTable({
  data,
  selectedRosterId,
}: PositionalTableProps) {
  if (data.buckets.length === 0 || data.weeksCounted === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Positional detail</h3>
        <ChartEmpty
          message="No weeks have been scored in this league yet — no positional totals to break down."
          height="sm"
        />
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3 tabular-nums">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold">Positional detail</h3>
        <p className="text-xs text-muted-foreground">
          {positionalWeekNote(data)} · share is of each team&apos;s own started
          points
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-card">
        <table className="w-full min-w-max border-collapse text-sm">
          <caption className="sr-only">
            Started points and share of own scoring, by team and lineup slot.
          </caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium">
                Team
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium">
                Slot
              </th>
              <th scope="col" className="px-2 py-2 text-right text-xs font-medium">
                Points
              </th>
              <th scope="col" className="px-2 py-2 text-right text-xs font-medium">
                Share
              </th>
              <th scope="col" className="px-2 py-2 text-right text-xs font-medium">
                Starts
              </th>
              <th scope="col" className="px-2 py-2 text-right text-xs font-medium">
                Rank
              </th>
            </tr>
          </thead>
          <tbody>
            {data.teams.map((team) => {
              const isSelected = team.nativeRosterId === selectedRosterId
              return team.buckets.map((slot, index) => (
                <tr
                  key={`${team.nativeRosterId}-${slot.key}`}
                  className={cn(
                    'border-b last:border-b-0',
                    isSelected && 'bg-muted',
                    // A hairline between teams, so a long grid still reads as
                    // blocks of one team rather than an undifferentiated list.
                    index === 0 && 'border-t'
                  )}
                >
                  <th
                    scope="row"
                    className="max-w-[10rem] truncate px-3 py-1.5 text-left font-normal"
                  >
                    {index === 0 ? (
                      <span className="font-medium">{teamLabel(team)}</span>
                    ) : (
                      <span className="sr-only">{teamLabel(team)}</span>
                    )}
                  </th>
                  <td className="px-2 py-1.5">
                    {bucketLabel(
                      data.buckets.find((bucket) => bucket.key === slot.key) ?? {
                        key: slot.key,
                        kind: 'dedicated',
                        slotCount: 0,
                        leagueAverage: 0,
                        leagueTotal: 0,
                        eligiblePositions: null,
                      }
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {formatPoints(slot.points)}
                  </td>
                  <td className="px-2 py-1.5 text-right text-muted-foreground">
                    {slot.sharePct.toFixed(1)}%
                  </td>
                  <td className="px-2 py-1.5 text-right text-muted-foreground">
                    {slot.starts}
                  </td>
                  <td className="px-2 py-1.5 text-right text-muted-foreground">
                    {slot.rank}
                  </td>
                </tr>
              ))
            })}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <th scope="row" className="px-3 py-2 text-left text-xs font-medium">
                League total
              </th>
              <td className="px-2 py-2 text-xs text-muted-foreground">
                all slots
              </td>
              <td className="px-2 py-2 text-right text-xs font-medium">
                {formatPoints(
                  data.teams.reduce((sum, team) => sum + team.totalPoints, 0)
                )}
              </td>
              <td className="px-2 py-2" />
              <td className="px-2 py-2 text-right text-xs text-muted-foreground">
                {data.teams.reduce((sum, team) => sum + team.totalStarts, 0)}
              </td>
              <td className="px-2 py-2" />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}
