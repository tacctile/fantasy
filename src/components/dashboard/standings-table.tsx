import type { StandingsData, StandingsTeam } from '@/services/dashboard'

interface StandingsTableProps {
  data: StandingsData
}

// Source precision: standings PF/PA are synced from Sleeper's fpts +
// fpts_decimal pair — two decimals is the wire precision, displayed exactly.
function formatPoints(points: number): string {
  return points.toFixed(2)
}

// W-L, with the ties segment appearing on every row only when any team in
// the league actually has a tie (Nick-signed 2026-07-22) — ties are rare
// and a permanent -0 suffix is noise in the common case.
function formatRecord(team: StandingsTeam, showTies: boolean): string {
  const base = `${team.wins}-${team.losses}`
  return showTies ? `${base}-${team.ties}` : base
}

const HEADER_CELL =
  'px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'

/**
 * Dense standings table — one of the app's two sanctioned true tabular
 * surfaces (DESIGN_SYSTEM.md; the other is the draft board). Renders the
 * service's ranked order as-is: the ordering itself lives only in
 * services/dashboard.ts (fetchRankedStandings), never re-derived here.
 * Team identity is the two-line pattern (team name, owner beneath). An
 * empty teams array is the honest unsynced state, not an error.
 */
export default function StandingsTable({ data }: StandingsTableProps) {
  const showTies = data.teams.some((team) => team.ties > 0)
  return (
    <div className="overflow-x-auto rounded-xl bg-card">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th scope="col" className={`${HEADER_CELL} text-right`}>
              Rk
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
              PA
            </th>
          </tr>
        </thead>
        <tbody>
          {data.teams.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-3 py-8 text-center text-sm text-muted-foreground"
              >
                No standings synced for this league yet.
              </td>
            </tr>
          ) : (
            data.teams.map((team) => (
              <tr
                key={team.nativeRosterId}
                className="border-b border-border/50 transition-colors hover:bg-muted"
              >
                <td className="px-3 py-2 text-right text-sm tabular-nums text-muted-foreground">
                  {team.rank}
                </td>
                <td className="px-3 py-2">
                  <span className="block truncate text-sm font-semibold">
                    {team.teamName ?? team.ownerDisplayName ?? '—'}
                  </span>
                  {team.teamName !== null && team.ownerDisplayName !== null && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {team.ownerDisplayName}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-sm tabular-nums">
                  {formatRecord(team, showTies)}
                </td>
                <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums">
                  {formatPoints(team.pointsFor)}
                </td>
                <td className="px-3 py-2 text-right text-sm tabular-nums text-secondary-foreground">
                  {formatPoints(team.pointsAgainst)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
