import { describe, expect, it } from 'vitest'

import { detectPositionalRuns } from './runs'

/**
 * Resilience item 2 — run detection triggering and RESETTING across the sliding
 * window (the "and auto-pick..." list's fourth case). Pure: exercises the exact
 * window/threshold behavior the live board's run badge depends on.
 */

const p = (pickNumber: number, position: string | null) => ({ pickNumber, position })

describe('detectPositionalRuns — sliding-window trigger and reset', () => {
  it('flags a deep-position run once the window count meets its threshold (RB = 3)', () => {
    // Last 6 picks contain 3 RBs.
    const board = detectPositionalRuns([
      p(1, 'WR'),
      p(2, 'QB'),
      p(3, 'RB'),
      p(4, 'RB'),
      p(5, 'TE'),
      p(6, 'RB'),
    ])
    expect(board.byPosition.RB.countInWindow).toBe(3)
    expect(board.byPosition.RB.isRun).toBe(true)
    expect(board.activeRuns).toContain('RB')
  })

  it('resets the run once those picks scroll out of the last-N window', () => {
    // The 3 RBs sit at picks 1-3; six later non-RB picks push them out of the
    // last-6 window, so the RB count in the window falls to 0 — no run.
    const board = detectPositionalRuns([
      p(1, 'RB'),
      p(2, 'RB'),
      p(3, 'RB'),
      p(4, 'WR'),
      p(5, 'QB'),
      p(6, 'TE'),
      p(7, 'QB'),
      p(8, 'WR'),
      p(9, 'TE'),
    ])
    expect(board.windowPickCount).toBe(6)
    expect(board.byPosition.RB).toBeUndefined()
    expect(board.activeRuns).not.toContain('RB')
  })

  it('flags a shallow position at its lower threshold (QB = 2)', () => {
    const board = detectPositionalRuns([
      p(1, 'WR'),
      p(2, 'RB'),
      p(3, 'QB'),
      p(4, 'TE'),
      p(5, 'QB'),
      p(6, 'WR'),
    ])
    expect(board.byPosition.QB.countInWindow).toBe(2)
    expect(board.activeRuns).toContain('QB')
  })

  it('never flags K/DEF — they occupy window slots but are not run-detectable', () => {
    const board = detectPositionalRuns([
      p(1, 'K'),
      p(2, 'K'),
      p(3, 'K'),
      p(4, 'DEF'),
      p(5, 'DEF'),
      p(6, 'DEF'),
    ])
    expect(board.activeRuns).toEqual([])
    expect(board.byPosition.K).toBeUndefined()
    expect(board.byPosition.DEF).toBeUndefined()
  })
})
