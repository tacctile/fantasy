import type {
  DraftBoardPlayer,
  RosterSlotLayout,
} from '@/services/draft-board'

export type TeamPositionFill = {
  /** Dedicated slot label (QB, RB, …), in the league's layout order. */
  position: string
  /** Players this team holds at that position (any roster slot). */
  count: number
  /** The league's dedicated starting slots at that position. */
  slots: number
  /** True when the position can't cover its dedicated starter slots. */
  need: boolean
}

export type TeamRosterFill = {
  nativeRosterId: number
  displayName: string
  totalCount: number
  starterCount: number
  benchCount: number
  reserveCount: number
  taxiCount: number
  positions: TeamPositionFill[]
}

/**
 * Pure roster-fill summary per team from the board pool — a static snapshot,
 * no live updates (Wave 3a scope). Positional need compares a team's player
 * count at each dedicated position against that position's dedicated slots
 * only (Nick-signed depth): flex-family slots are never force-assigned to a
 * position, so a FLEX-covered lineup can still honestly show an RB need.
 */
export function computeRosterFill(
  players: DraftBoardPlayer[],
  layout: RosterSlotLayout | null
): TeamRosterFill[] {
  const teams = new Map<number, TeamRosterFill>()
  const positionCounts = new Map<number, Map<string, number>>()

  for (const player of players) {
    if (
      player.availability !== 'rostered' ||
      player.rosteredByNativeRosterId === null
    ) {
      continue
    }
    const rosterId = player.rosteredByNativeRosterId
    let team = teams.get(rosterId)
    if (team === undefined) {
      team = {
        nativeRosterId: rosterId,
        displayName:
          player.rosteredByTeamName ??
          player.rosteredByOwnerDisplayName ??
          `Roster ${rosterId}`,
        totalCount: 0,
        starterCount: 0,
        benchCount: 0,
        reserveCount: 0,
        taxiCount: 0,
        positions: [],
      }
      teams.set(rosterId, team)
      positionCounts.set(rosterId, new Map())
    }
    team.totalCount += 1
    if (player.rosteredSlot === 'starter') team.starterCount += 1
    else if (player.rosteredSlot === 'bench') team.benchCount += 1
    else if (player.rosteredSlot === 'reserve') team.reserveCount += 1
    else if (player.rosteredSlot === 'taxi') team.taxiCount += 1
    if (player.position !== null) {
      const counts = positionCounts.get(rosterId)!
      counts.set(player.position, (counts.get(player.position) ?? 0) + 1)
    }
  }

  const dedicatedEntries =
    layout === null ? [] : Object.entries(layout.dedicated)
  for (const team of teams.values()) {
    const counts = positionCounts.get(team.nativeRosterId)!
    team.positions = dedicatedEntries.map(([position, slots]) => {
      const count = counts.get(position) ?? 0
      return { position, count, slots, need: count < slots }
    })
  }

  return [...teams.values()].sort(
    (a, b) => a.nativeRosterId - b.nativeRosterId
  )
}
