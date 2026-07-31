import { ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { PowerRankingsData, PowerRankingTeam } from '@/services/dashboard'

import SpectatorUnofficialChip from './spectator-unofficial-chip'

interface SpectatorPowerRankingsProps {
  data: PowerRankingsData
}

/**
 * Rank movement against the standings order — the one secondary signal the
 * spectator list keeps, because it is the whole point of a power ranking
 * ("stronger/weaker than the record shows"). The value comes from the service;
 * never recomputed here.
 */
function RankDelta({ team }: { team: PowerRankingTeam }) {
  if (team.rankDelta === null || team.rankDelta === 0) {
    return <span className="text-sm text-muted-foreground">—</span>
  }
  const up = team.rankDelta > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums',
        up ? 'text-positive' : 'text-destructive'
      )}
    >
      {up ? (
        <ChevronUp aria-hidden className="size-3.5" />
      ) : (
        <ChevronDown aria-hidden className="size-3.5" />
      )}
      {Math.abs(team.rankDelta)}
    </span>
  )
}

/**
 * Spectator power rankings — compact ranked list: rank, team, and the delta
 * versus the standings order. The admin list's dense secondaries (all-play
 * W-L, win%, counted-week PF) are dropped per this wave's spectator scope.
 *
 * The low-confidence caveat is NOT dropped: a schedule-neutral reading built
 * from fewer than ~6 counted weeks is sample-noise-dominated and the platform
 * must flag it rather than present it with full weight
 * (wiki: in-season-management/points-for-against-luck-analysis — a decided
 * presentation rule, not an admin-only nicety). Weeks containing non-final
 * scores are called out for the same honesty reason.
 */
export default function SpectatorPowerRankings({
  data,
}: SpectatorPowerRankingsProps) {
  return (
    <div className="flex flex-col gap-2">
      {data.lowConfidence && (
        <p className="text-xs text-muted-foreground">
          Early-season reading — only {data.weeksCounted}{' '}
          {data.weeksCounted === 1 ? 'week' : 'weeks'} counted, so treat this
          order loosely.
        </p>
      )}
      {data.nonFinalWeeksCounted > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SpectatorUnofficialChip isFinal={false} />
          {data.nonFinalWeeksCounted} of {data.weeksCounted} counted weeks
          include unofficial scores.
        </p>
      )}
      {data.teams.length === 0 ? (
        <div className="rounded-xl bg-card px-3 py-8 text-center text-sm text-muted-foreground">
          No scored weeks to rank yet.
        </div>
      ) : (
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
              <span className="w-10 shrink-0 text-right">
                <RankDelta team={team} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
