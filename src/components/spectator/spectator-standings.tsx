import type { StandingsData, StandingsTeam } from '@/services/dashboard'

interface SpectatorStandingsProps {
  data: StandingsData
}

// Source precision: standings PF is synced from Sleeper's fpts + fpts_decimal
// pair — two decimals is the wire precision, displayed exactly.
function formatPoints(points: number): string {
  return points.toFixed(2)
}

// Same conditional-ties rule as the admin table: the ties segment appears only
// when some team in the league actually has one.
function formatRecord(team: StandingsTeam, showTies: boolean): string {
  const base = `${team.wins}-${team.losses}`
  return showTies ? `${base}-${team.ties}` : base
}

/**
 * Spectator standings — mobile-first stacked rows, not the admin's dense
 * table. Points-against is deliberately absent (Nick's Clarify): PF is the
 * roster-quality signal while PA is mostly exogenous schedule noise
 * (wiki: in-season-management/points-for-against-luck-analysis), so it is the
 * first column to drop on a phone. Ordering is the service's ranked order
 * rendered as-is — never re-derived here (services/dashboard.ts is its only
 * home). No admin controls, no links, no shared admin UI.
 */
export default function SpectatorStandings({ data }: SpectatorStandingsProps) {
  const showTies = data.teams.some((team) => team.ties > 0)
  if (data.teams.length === 0) {
    return (
      <div className="rounded-xl bg-card px-3 py-8 text-center text-sm text-muted-foreground">
        No standings for this league yet.
      </div>
    )
  }
  return (
    <ol className="divide-y divide-border/50 rounded-xl bg-card">
      {data.teams.map((team) => (
        <li
          key={team.nativeRosterId}
          className="flex items-center gap-3 px-3 py-2.5"
        >
          <span className="w-5 shrink-0 text-right text-sm font-semibold tabular-nums text-muted-foreground">
            {team.rank}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {team.teamName ?? team.ownerDisplayName ?? '—'}
            </span>
            {team.teamName !== null && team.ownerDisplayName !== null && (
              <span className="block truncate text-xs text-muted-foreground">
                {team.ownerDisplayName}
              </span>
            )}
          </span>
          <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
            {formatRecord(team, showTies)}
          </span>
          <span className="w-20 shrink-0 text-right">
            <span className="block text-sm tabular-nums">
              {formatPoints(team.pointsFor)}
            </span>
            <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
              pts for
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}
