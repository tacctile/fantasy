import { describe, expect, it } from 'vitest'

import type { RosterSlotLayout } from '@/services/draft-board'

import { computeBpaBoard } from './board'
import type { ReplacementPoolPlayer } from './replacement'

/**
 * Resilience item 2 — BPA / replacement-level RECOMPUTE after a pick is recorded
 * (the list's second case). Pure: verifies the build-file item-4 mandate that
 * there is no cached pre-draft baseline — removing a startable player deepens
 * the position's replacement line and raises a survivor's VORP.
 */

const LAYOUT: RosterSlotLayout = {
  dedicated: { QB: 1, RB: 2, WR: 2, TE: 1 },
  flex: { FLEX: 1 },
  bench: 6,
  ir: 0,
  taxi: 0,
}
const LEAGUE_SIZE = 1

const player = (
  sleeperPlayerId: string,
  position: string,
  projectedPoints: number
): ReplacementPoolPlayer => ({ sleeperPlayerId, position, projectedPoints })

describe('computeBpaBoard — dynamic recompute against the shrinking pool', () => {
  it('deepens the replacement line and raises a survivor VORP when a startable is drafted', () => {
    // RB startable demand at league size 1 = 2 dedicated + the FLEX (best of
    // RB/WR/TE) → rb3 wins the flex, so the RB replacement line is rb3 (180).
    const pool: ReplacementPoolPlayer[] = [
      player('rb1', 'RB', 200),
      player('rb2', 'RB', 190),
      player('rb3', 'RB', 180),
      player('rb4', 'RB', 100),
      player('rb5', 'RB', 90),
      player('wr1', 'WR', 80),
      player('wr2', 'WR', 70),
      player('wr3', 'WR', 60),
      player('te1', 'TE', 50),
      player('qb1', 'QB', 40),
    ]

    const before = computeBpaBoard(pool, LAYOUT, LEAGUE_SIZE, null)
    // rb2 (a dedicated RB starter) is drafted — the pool shrinks.
    const after = computeBpaBoard(
      pool.filter((p) => p.sleeperPlayerId !== 'rb2'),
      LAYOUT,
      LEAGUE_SIZE,
      null
    )

    const rb1Before = before.baseValues.players.find(
      (p) => p.sleeperPlayerId === 'rb1'
    )
    const rb1After = after.baseValues.players.find(
      (p) => p.sleeperPlayerId === 'rb1'
    )
    expect(rb1Before).toBeDefined()
    expect(rb1After).toBeDefined()

    // Replacement RB shifts from rb3 (180) down to rb4 (100): a deeper line.
    expect(rb1After!.replacementPoints).toBeLessThan(rb1Before!.replacementPoints)
    // The survivor's value over that deeper replacement rises accordingly.
    expect(rb1After!.baseValue).toBeGreaterThan(rb1Before!.baseValue)
  })
})
