'use client'

import { useEffect, useMemo, useState } from 'react'

import type { DraftBoardPlayer } from '@/services/draft-board'

/** Canonical filterable positions — the ADP ingestion's Nick-signed position set. */
export const FILTER_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'] as const

export type SortKey = 'adp' | 'posRank' | 'name'
export type SortDirection = 'asc' | 'desc'

export type PlayerListFilterState = {
  /** Text query, already debounced by the time it reaches the pure function. */
  query: string
  /** Empty = all positions. */
  positions: string[]
  availableOnly: boolean
  sortKey: SortKey
  sortDirection: SortDirection
}

export const DEFAULT_FILTER_STATE: PlayerListFilterState = {
  query: '',
  positions: [],
  // 'all' is the honest default while the connected league is season-complete
  // and fully rostered; one toggle reaches draft-day's available-only view.
  availableOnly: false,
  sortKey: 'adp',
  sortDirection: 'asc',
}

function compareNullableNumber(
  a: number | null,
  b: number | null,
  direction: SortDirection
): number {
  // Missing values sort last in BOTH directions — a null ADP/rank is "no
  // data", not a large or small value.
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === 'asc' ? a - b : b - a
}

function compareNullableString(
  a: string | null,
  b: string | null,
  direction: SortDirection
): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  const cmp = a.localeCompare(b)
  return direction === 'asc' ? cmp : -cmp
}

// The deterministic final tie-breaker on every sort path (stable ordering,
// same rule as the data layer's default ordering).
function comparePlayerId(a: DraftBoardPlayer, b: DraftBoardPlayer): number {
  return a.sleeperPlayerId < b.sleeperPlayerId
    ? -1
    : a.sleeperPlayerId > b.sleeperPlayerId
      ? 1
      : 0
}

/**
 * Pure filter + sort over the full board pool. No state, no memoization, no
 * side effects — `usePlayerList` owns the memo; tests can call this directly.
 */
export function filterAndSortPlayers(
  players: DraftBoardPlayer[],
  state: PlayerListFilterState
): DraftBoardPlayer[] {
  const query = state.query.trim().toLowerCase()
  const positions = state.positions.length > 0 ? new Set(state.positions) : null

  const filtered = players.filter((player) => {
    if (state.availableOnly && player.availability !== 'available') return false
    if (
      positions !== null &&
      (player.position === null || !positions.has(player.position))
    ) {
      return false
    }
    if (query !== '') {
      const name = player.fullName?.toLowerCase() ?? ''
      const team = player.team?.toLowerCase() ?? ''
      if (!name.includes(query) && !team.includes(query)) return false
    }
    return true
  })

  const { sortKey, sortDirection } = state
  filtered.sort((a, b) => {
    let cmp = 0
    if (sortKey === 'adp') {
      cmp = compareNullableNumber(a.adpOverall, b.adpOverall, sortDirection)
    } else if (sortKey === 'posRank') {
      cmp = compareNullableNumber(
        a.positionalRank,
        b.positionalRank,
        sortDirection
      )
    } else {
      cmp = compareNullableString(a.fullName, b.fullName, sortDirection)
    }
    return cmp !== 0 ? cmp : comparePlayerId(a, b)
  })

  return filtered
}

/** Debounce a fast-changing value (the search box) without extra renders elsewhere. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

/**
 * Memoized view of the board pool for the current filter/sort state. The raw
 * query debounces here (250ms) so keystrokes never re-filter the full pool;
 * everything else recomputes immediately.
 */
export function usePlayerList(
  players: DraftBoardPlayer[],
  state: PlayerListFilterState
): DraftBoardPlayer[] {
  const debouncedQuery = useDebouncedValue(state.query, 250)
  const { positions, availableOnly, sortKey, sortDirection } = state
  return useMemo(
    () =>
      filterAndSortPlayers(players, {
        query: debouncedQuery,
        positions,
        availableOnly,
        sortKey,
        sortDirection,
      }),
    [players, debouncedQuery, positions, availableOnly, sortKey, sortDirection]
  )
}
