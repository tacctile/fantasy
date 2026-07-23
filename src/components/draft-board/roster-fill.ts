import type {
  DraftBoardPlayer,
  LeagueRoster,
  RosterSlotLayout,
} from '@/services/draft-board'
import type { RecordedPick } from '@/services/draft-picks'

import { rosterLabel } from './player-row'

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
  /** draft_state picks attributed to this team (a draft-history dimension —
   *  a drafted-then-dropped player still counts here, never in holdings). */
  draftedCount: number
  positions: TeamPositionFill[]
}

/**
 * Pure roster-fill summary per team, live as picks land from any source
 * (Wave 3b UI extensions item 3 — all four blend rules Nick-signed
 * 2026-07-22). Two dimensions per team:
 *
 * Holdings (union by player): the rostered baseline wins — a live pick adds
 * its player to position fill only when that player is not rostered anywhere.
 * During a real live draft rosters aren't synced yet, so picks ARE the
 * holdings; on a synced league the baseline keeps authority. ST/BN/IR/TX
 * counts stay roster-sync-only — picks carry no lineup slot (the roster
 * endpoint's domain, not the draft endpoint's), so none is invented.
 *
 * Drafted (pick count): every attributed pick increments `draftedCount`,
 * rostered or not. Pick→team attribution is `nativeRosterId` (Sleeper's
 * roster_id — the ownership field per sleeper-api/draft-endpoint). A pick
 * whose player is outside the board pool contributes attribution only (no
 * position data client-side — the recent-picks feed surfaces its identity).
 *
 * Positional need compares a team's player count at each dedicated position
 * against that position's dedicated slots only (Nick-signed depth):
 * flex-family slots are never force-assigned to a position, so a
 * FLEX-covered lineup can still honestly show an RB need.
 *
 * Only confirmed draft_state rows count (Nick-signed) — the optimistic
 * pending overlay never reaches this function.
 */
export function computeRosterFill(
  players: DraftBoardPlayer[],
  layout: RosterSlotLayout | null,
  livePicks: RecordedPick[] = [],
  rosters: LeagueRoster[] = []
): TeamRosterFill[] {
  const teams = new Map<number, TeamRosterFill>()
  const positionCounts = new Map<number, Map<string, number>>()
  const rosteredPlayerIds = new Set<string>()

  const ensureTeam = (rosterId: number, displayName: string): TeamRosterFill => {
    let team = teams.get(rosterId)
    if (team === undefined) {
      team = {
        nativeRosterId: rosterId,
        displayName,
        totalCount: 0,
        starterCount: 0,
        benchCount: 0,
        reserveCount: 0,
        taxiCount: 0,
        draftedCount: 0,
        positions: [],
      }
      teams.set(rosterId, team)
      positionCounts.set(rosterId, new Map())
    }
    return team
  }

  for (const player of players) {
    if (player.availability !== 'rostered') continue
    // Rostered anywhere blocks the pick overlay for this player even if
    // attribution is somehow absent — the baseline stays authoritative.
    rosteredPlayerIds.add(player.sleeperPlayerId)
    if (player.rosteredByNativeRosterId === null) continue
    const team = ensureTeam(
      player.rosteredByNativeRosterId,
      player.rosteredByTeamName ??
        player.rosteredByOwnerDisplayName ??
        `Roster ${player.rosteredByNativeRosterId}`
    )
    team.totalCount += 1
    if (player.rosteredSlot === 'starter') team.starterCount += 1
    else if (player.rosteredSlot === 'bench') team.benchCount += 1
    else if (player.rosteredSlot === 'reserve') team.reserveCount += 1
    else if (player.rosteredSlot === 'taxi') team.taxiCount += 1
    if (player.position !== null) {
      const counts = positionCounts.get(team.nativeRosterId)!
      counts.set(player.position, (counts.get(player.position) ?? 0) + 1)
    }
  }

  if (livePicks.length > 0) {
    const rosterById = new Map(
      rosters.map((roster) => [roster.nativeRosterId, roster])
    )
    const positionByPlayerId = new Map<string, string | null>()
    for (const player of players) {
      positionByPlayerId.set(player.sleeperPlayerId, player.position)
    }
    // Duplicate players across pick numbers can't be written by our paths
    // (server-side duplicate rejection); if one ever appears, only the first
    // occurrence feeds position fill (live-picks merge precedent).
    const filledPickedPlayerIds = new Set<string>()
    for (const pick of livePicks) {
      const roster = rosterById.get(pick.nativeRosterId)
      const team = ensureTeam(
        pick.nativeRosterId,
        roster !== undefined ? rosterLabel(roster) : `Roster ${pick.nativeRosterId}`
      )
      team.draftedCount += 1
      if (
        rosteredPlayerIds.has(pick.sleeperPlayerId) ||
        filledPickedPlayerIds.has(pick.sleeperPlayerId)
      ) {
        continue
      }
      filledPickedPlayerIds.add(pick.sleeperPlayerId)
      const position = positionByPlayerId.get(pick.sleeperPlayerId) ?? null
      if (position !== null) {
        const counts = positionCounts.get(team.nativeRosterId)!
        counts.set(position, (counts.get(position) ?? 0) + 1)
      }
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
