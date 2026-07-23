import { describe, expect, it } from 'vitest'

import type { BaseValuePlayer } from './base-value'
import { computePositionTiers } from './tiers'

/**
 * Resilience item 2 — tier-boundary RECOMPUTE after a pick shifts the pool (the
 * list's third case). Pure: crafted projections make the median-gap break
 * threshold deterministic, so removing the cliff-defining player demonstrably
 * collapses two tiers into one — the shrinking-pool recompute board.ts relies on.
 */

const rb = (id: string, projectedPoints: number): BaseValuePlayer => ({
  sleeperPlayerId: id,
  position: 'RB',
  projectedPoints,
  // Replacement 0 so every crafted player is at/above the line and tiered.
  replacementPoints: 0,
  baseValue: projectedPoints,
  replacementSource: 'structural',
})

describe('computePositionTiers — recompute as the pool shrinks', () => {
  it('detects two RB tiers separated by a clear cliff', () => {
    // gaps [2,2,46], median 2, RB threshold 3.0 x 2 = 6 → break at the 46 gap.
    const board = computePositionTiers([
      rb('a', 100),
      rb('b', 98),
      rb('c', 96),
      rb('d', 50),
    ])
    const tiers = board.byPosition.RB.tiers
    expect(tiers).toHaveLength(2)
    expect(tiers[0].playerIds).toEqual(['a', 'b', 'c'])
    expect(tiers[1].playerIds).toEqual(['d'])
  })

  it('recomputes to a single tier once the cliff-defining pick leaves the pool', () => {
    // 'c' (96) is drafted; remaining gaps [2,48], median 25, threshold 75 → the
    // 48 gap no longer exceeds it, so the cliff is gone and it is one tier.
    const board = computePositionTiers([rb('a', 100), rb('b', 98), rb('d', 50)])
    const tiers = board.byPosition.RB.tiers
    expect(tiers).toHaveLength(1)
    expect(tiers[0].playerIds).toEqual(['a', 'b', 'd'])
  })
})
