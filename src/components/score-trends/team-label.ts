import type { TeamScoreTrend } from '@/services/score-trends'

/**
 * The roster display convention on the Score Trends surface: team name, else
 * owner, else the roster number.
 *
 * Deliberately the same fallback chain as `rosterLabel` on the draft board
 * (`components/draft-board/player-row.tsx`) rather than an import of it — the
 * draft board's copy takes a draft-shaped roster row, and a chart section
 * reaching into draft-board UI to name a team would couple two surfaces that
 * have no other relationship. One convention, expressed twice, in the shape
 * each surface actually holds.
 */
export function teamLabel(team: {
  nativeRosterId: number
  teamName: string | null
  ownerDisplayName: string | null
}): string {
  return team.teamName ?? team.ownerDisplayName ?? `Roster ${team.nativeRosterId}`
}

/** The same label with the owner as a second line's worth of context. */
export function teamSubLabel(team: TeamScoreTrend): string | null {
  if (team.teamName === null) return null
  return team.ownerDisplayName
}
