import { ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { PowerRankingsData, PowerRankingTeam } from '@/services/dashboard'

import UnofficialChip from './unofficial-chip'

interface PowerRankingsListProps {
  data: PowerRankingsData
}

// Sports convention: win percentage as a three-decimal figure (".706").
function formatWinPct(winPct: number): string {
  return winPct.toFixed(3).replace(/^0/, '')
}

// Same conditional-ties rule as the standings record (Nick-signed): the
// ties segment appears only when any team actually has an all-play tie.
function formatAllPlayRecord(team: PowerRankingTeam, showTies: boolean): string {
  const base = `${team.allPlayWins}-${team.allPlayLosses}`
  return showTies ? `${base}-${team.allPlayTies}` : base
}

/**
 * Rank-delta vs the standings ordering: positive means the all-play read is
 * stronger than the record shows (buy-low framing) → --positive; negative →
 * --destructive; zero/no-standings renders muted. The delta value itself
 * comes from the service — never recomputed here.
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
 * All-Play power rankings as a hybrid row-in-card list (true tables stay
 * reserved for standings and the draft board — DESIGN_SYSTEM.md). Renders
 * the service's ordering as-is; the formula lives only in
 * services/dashboard.ts. Under six counted weeks the reading is flagged
 * low-confidence, and weeks containing unofficial scores are called out —
 * both per the wiki's decided luck-analysis presentation rules, never
 * silently presented as settled.
 */
export default function PowerRankingsList({ data }: PowerRankingsListProps) {
  const showTies = data.teams.some((team) => team.allPlayTies > 0)
  return (
    <div className="flex flex-col gap-2">
      {data.lowConfidence && (
        <p className="text-xs text-muted-foreground">
          Low confidence — only {data.weeksCounted}{' '}
          {data.weeksCounted === 1 ? 'week' : 'weeks'} counted (all-play
          readings stabilize around 6).
        </p>
      )}
      {data.nonFinalWeeksCounted > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UnofficialChip isFinal={false} />
          {data.nonFinalWeeksCounted} of {data.weeksCounted} counted weeks
          include unofficial scores.
        </p>
      )}
      <div className="rounded-xl bg-card">
        {data.teams.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No scored weeks to rank for this league yet.
          </div>
        ) : (
          <ol className="divide-y divide-border/50">
            {data.teams.map((team) => (
              <li
                key={team.nativeRosterId}
                className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted"
              >
                <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-muted-foreground">
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
                <span className="hidden text-right sm:block">
                  <span className="block text-sm font-semibold tabular-nums">
                    {formatAllPlayRecord(team, showTies)}
                  </span>
                  <span className="block text-xs tabular-nums text-muted-foreground">
                    all-play {formatWinPct(team.allPlayWinPct)}
                  </span>
                </span>
                <span className="w-20 shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums">
                    {team.pointsFor.toFixed(2)}
                  </span>
                  <span className="block text-xs text-muted-foreground">PF</span>
                </span>
                <span className="w-12 shrink-0 text-right">
                  <RankDelta team={team} />
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
