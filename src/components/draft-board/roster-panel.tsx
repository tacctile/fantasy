import { cn } from '@/lib/utils'
import type {
  DraftBoardLeagueContext,
  DraftBoardPlayer,
} from '@/services/draft-board'

import { computeRosterFill } from './roster-fill'

interface RosterPanelProps {
  players: DraftBoardPlayer[]
  context: DraftBoardLeagueContext
}

/**
 * Roster/positional-need sidebar: each team's roster fill as a static
 * snapshot (no live updates — Wave 3a). Per team: slot-group totals against
 * derived_config capacities, and per-position fill vs the league's dedicated
 * starting slots from the raw slot layout — under-filled positions flag in
 * the warning tier (actionable draft information). Flex slots render as their
 * own line, never force-assigned to a position. IR capacity reads
 * derived_config's ir_slot_count (reserve_slots-aware), not the raw IR label
 * count.
 */
export default function RosterPanel({ players, context }: RosterPanelProps) {
  const teams = computeRosterFill(players, context.slotLayout)
  const flexEntries =
    context.slotLayout === null ? [] : Object.entries(context.slotLayout.flex)

  if (teams.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        No rostered players in this league yet.
      </p>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-baseline justify-between pb-2">
        <h2 className="text-sm font-semibold">Rosters</h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {context.leagueSize ?? teams.length} teams
          {flexEntries.length > 0 && (
            <>
              {' · '}
              {flexEntries
                .map(([label, count]) => `${count} ${label}`)
                .join(' · ')}
            </>
          )}
        </p>
      </div>
      {context.slotLayout === null && (
        <p className="pb-2 text-xs text-muted-foreground">
          Roster layout unavailable — showing slot totals only.
        </p>
      )}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {teams.map((team) => (
          <div key={team.nativeRosterId} className="rounded-xl bg-card p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold">
                {team.displayName}
              </p>
              <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {team.starterCount}
                {context.activeSlotCount !== null &&
                  `/${context.activeSlotCount}`}{' '}
                ST · {team.benchCount}
                {context.benchSlotCount !== null &&
                  `/${context.benchSlotCount}`}{' '}
                BN
                {(team.reserveCount > 0 ||
                  (context.irSlotCount ?? 0) > 0) && (
                  <>
                    {' '}
                    · {team.reserveCount}
                    {context.irSlotCount !== null &&
                      `/${context.irSlotCount}`}{' '}
                    IR
                  </>
                )}
                {team.taxiCount > 0 && <> · {team.taxiCount} TX</>}
              </p>
            </div>
            {team.positions.length > 0 && (
              <p className="pt-1.5 text-xs tabular-nums">
                {team.positions.map((fill, index) => (
                  <span
                    key={fill.position}
                    className={cn(
                      'whitespace-nowrap',
                      fill.need
                        ? 'font-semibold text-warning'
                        : 'text-muted-foreground'
                    )}
                  >
                    {index > 0 && <span className="text-muted-foreground"> · </span>}
                    {fill.position} {fill.count}/{fill.slots}
                  </span>
                ))}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
