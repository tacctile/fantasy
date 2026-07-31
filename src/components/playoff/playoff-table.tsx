import Link from 'next/link'

import { teamLabel } from '@/components/score-trends/team-label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PlayoffPictureData, PlayoffTeam } from '@/services/playoff-picture'

import { clinchSentence, STATUS_CLASS, STATUS_LABEL } from './playoff-notes'

interface PlayoffTableProps {
  data: PlayoffPictureData
  /** Link target for row focus — team selection is a URL param, not state. */
  basePath: string
  selectedRosterId: number | null
  /**
   * Teams whose status differs from the real picture, when a hypothetical is
   * applied. Empty in the ordinary case — the table is the same table either
   * way, marked rather than duplicated.
   */
  changedRosterIds?: ReadonlySet<number>
}

const HEADER_CELL =
  'px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'

/**
 * W-L, with the ties segment shown on every row only when some team in the
 * league actually has one — the same convention `StandingsTable` established
 * (Nick-signed 2026-07-22), so the two tables never format the same record
 * differently.
 */
function formatRecord(team: PlayoffTeam, showTies: boolean): string {
  const base = `${team.wins}-${team.losses}`
  return showTies ? `${base}-${team.ties}` : base
}

/**
 * The admin playoff-picture table (Wave 5 — Playoff picture, item 4).
 *
 * A dense table, not a chart, and deliberately so. The build file bars any
 * probability-style bar or probabilistic-looking visual, because this
 * platform's playoff mechanism is deterministic clinch/eliminate rather than
 * simulation — so every cell here is either a counted fact (record, points for,
 * games left) or a verdict that is true under any tiebreaker. There is no
 * gradient, no meter, no percentage, and no ordering by anything other than the
 * seed the service computed.
 *
 * The CUT LINE is drawn from `data.fieldSize` — the same clamped number every
 * status above it was decided against — rather than from a second read of the
 * raw setting, so the line and the badges can never disagree.
 *
 * Row focus is a link, not client state (Nick's Clarify): the table stays
 * server-rendered with zero client JavaScript, and a focused view is shareable.
 * There is still no durable per-league my-team, so this is the honest stand-in
 * until that migration ships.
 */
export default function PlayoffTable({
  data,
  basePath,
  selectedRosterId,
  changedRosterIds,
}: PlayoffTableProps) {
  const showTies = data.teams.some((team) => team.ties > 0)
  const cutAfter = data.fieldSize

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold tracking-tight">Playoff picture</h2>
        {cutAfter !== null && (
          <p className="text-xs text-muted-foreground">
            <span className="tabular-nums">{cutAfter}</span> playoff spots
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl bg-card">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th scope="col" className={`${HEADER_CELL} text-right`}>
                Seed
              </th>
              <th scope="col" className={`${HEADER_CELL} text-left`}>
                Team
              </th>
              <th scope="col" className={`${HEADER_CELL} text-right`}>
                Record
              </th>
              <th scope="col" className={`${HEADER_CELL} text-right`}>
                PF
              </th>
              <th scope="col" className={`${HEADER_CELL} text-right`}>
                Left
              </th>
              <th scope="col" className={`${HEADER_CELL} text-left`}>
                Status
              </th>
              <th scope="col" className={`${HEADER_CELL} text-left`}>
                Clinch
              </th>
            </tr>
          </thead>
          <tbody>
            {data.teams.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  No teams or matchups synced for this league yet.
                </td>
              </tr>
            ) : (
              data.teams.map((team) => {
                const selected = team.nativeRosterId === selectedRosterId
                // The playoff cut: a border under the last team inside the
                // field. Skipped when it would fall on the final row, where a
                // line reads as a table edge rather than a boundary.
                const onCut =
                  cutAfter !== null &&
                  team.seed === cutAfter &&
                  team.seed < data.teams.length

                return (
                  <tr
                    key={team.nativeRosterId}
                    className={cn(
                      'border-b border-border/50 transition-colors hover:bg-muted',
                      onCut && 'border-b-2 border-b-border',
                      selected && 'bg-muted'
                    )}
                  >
                    <td className="px-3 py-2 text-right text-sm tabular-nums text-muted-foreground">
                      {team.seed}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={
                          selected
                            ? basePath
                            : `${basePath}?team=${team.nativeRosterId}`
                        }
                        aria-current={selected ? 'true' : undefined}
                        className="block truncate text-sm font-semibold underline-offset-4 hover:underline"
                      >
                        {teamLabel(team)}
                      </Link>
                      {team.teamName !== null &&
                        team.ownerDisplayName !== null && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {team.ownerDisplayName}
                          </span>
                        )}
                    </td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums">
                      {formatRecord(team, showTies)}
                      {team.disagreesWithStandings && (
                        <span
                          title="Differs from the synced standings snapshot"
                          className="ml-1 text-warning"
                          aria-label="Differs from the synced standings snapshot"
                        >
                          *
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums">
                      {team.pointsFor.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums text-muted-foreground">
                      {team.gamesRemaining}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={cn('whitespace-nowrap', STATUS_CLASS[team.status])}
                      >
                        {STATUS_LABEL[team.status]}
                      </Badge>
                      {changedRosterIds?.has(team.nativeRosterId) === true && (
                        <span className="ml-1.5 whitespace-nowrap text-xs text-warning">
                          changed by what-if
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      {clinchSentence(team)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
