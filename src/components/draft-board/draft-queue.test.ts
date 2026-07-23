import { describe, expect, it } from 'vitest'

import type { RosterSlotLayout } from '@/services/draft-board'

import { positionCap, selectAutoPickCandidate } from './draft-queue'

/**
 * Resilience item 2 — auto-pick SKIPPING a queue entry that violates a hard
 * roster rule (the list's fifth case, the build-file "3rd QB before the bench is
 * otherwise full" example), plus the never-fail-to-pick fall-through.
 */

const LAYOUT: RosterSlotLayout = {
  dedicated: { QB: 1, RB: 2, WR: 2, TE: 1 },
  flex: { FLEX: 1 },
  bench: 6,
  ir: 0,
  taxi: 0,
}

const positionOf = (map: Record<string, string>) => (id: string) => map[id] ?? null

describe('selectAutoPickCandidate — hard roster-rule skip', () => {
  it('caps QB at 2 in a 1-QB league (1 dedicated + 0 flex-eligible + 1 margin)', () => {
    // FLEX is RB/WR/TE only, so QB gets no flex eligibility.
    expect(positionCap('QB', LAYOUT)).toBe(2)
  })

  it('skips a queue entry that violates a hard roster rule (a 3rd QB)', () => {
    const selection = selectAutoPickCandidate({
      queue: ['qb3', 'rb1'],
      isDraftable: () => true,
      positionOf: positionOf({ qb3: 'QB', rb1: 'RB' }),
      rosterPositions: ['QB', 'QB'],
      layout: LAYOUT,
    })
    expect(selection).toEqual({ candidateId: 'rb1', overCapFallThrough: false })
  })

  it('falls through to the top entry when every draftable entry is over its cap (never fails to pick)', () => {
    const selection = selectAutoPickCandidate({
      queue: ['qb3'],
      isDraftable: () => true,
      positionOf: positionOf({ qb3: 'QB' }),
      rosterPositions: ['QB', 'QB'],
      layout: LAYOUT,
    })
    expect(selection).toEqual({ candidateId: 'qb3', overCapFallThrough: true })
  })

  it('takes the top under-cap entry when the roster has room', () => {
    const selection = selectAutoPickCandidate({
      queue: ['qb1', 'rb1'],
      isDraftable: () => true,
      positionOf: positionOf({ qb1: 'QB', rb1: 'RB' }),
      rosterPositions: [],
      layout: LAYOUT,
    })
    expect(selection).toEqual({ candidateId: 'qb1', overCapFallThrough: false })
  })
})
