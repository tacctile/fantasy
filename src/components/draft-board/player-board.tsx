'use client'

import { useState } from 'react'

import type {
  DraftBoardLeagueContext,
  DraftBoardPlayer,
} from '@/services/draft-board'

import AdpNotice from './adp-notice'
import BoardEmptyState from './board-empty-state'
import BoardToolbar from './board-toolbar'
import CommandChip from './command-chip'
import PlayerTable from './player-table'
import {
  DEFAULT_FILTER_STATE,
  usePlayerList,
  type PlayerListFilterState,
  type SortKey,
} from './use-player-list'

interface PlayerBoardProps {
  players: DraftBoardPlayer[]
  context: DraftBoardLeagueContext
}

/**
 * The board's player-list region: owns the filter/sort state, derives the
 * visible list through the memoized `usePlayerList`, and composes the ADP
 * notice + toolbar over the table. Re-clicking the active sort column flips
 * direction; a new column starts ascending (ADP/rank/name all read best-first
 * ascending). A truly empty pool (no ADP snapshot AND nothing rostered — a
 * fresh league) renders a full-region empty state instead of banner + table,
 * carrying its own next actions so the two surfaces never double-message.
 */
export default function PlayerBoard({ players, context }: PlayerBoardProps) {
  const [filterState, setFilterState] =
    useState<PlayerListFilterState>(DEFAULT_FILTER_STATE)
  const visiblePlayers = usePlayerList(players, filterState)

  const handleSortChange = (key: SortKey) => {
    setFilterState((state) => ({
      ...state,
      sortKey: key,
      sortDirection:
        state.sortKey === key && state.sortDirection === 'asc' ? 'desc' : 'asc',
    }))
  }

  // Clearing resets what narrows the pool — never the chosen sort.
  const handleClearFilters = () => {
    setFilterState((state) => ({
      ...state,
      query: '',
      positions: [],
      availableOnly: false,
    }))
  }
  const hasActiveFilters =
    filterState.query.trim() !== '' ||
    filterState.positions.length > 0 ||
    filterState.availableOnly

  if (players.length === 0) {
    return (
      <div className="rounded-xl bg-card">
        <BoardEmptyState
          title="The board is empty"
          detail="No ADP snapshot matches this league, and no players are rostered yet."
        >
          <p>
            Run <CommandChip command="npm run sync:adp" /> — or ADP lands with
            the daily sync at 10:00 UTC.
          </p>
          <p className="pt-1">
            Rosters connect with{' '}
            <CommandChip command="npm run sync:league -- <league_id>" />.
          </p>
        </BoardEmptyState>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdpNotice context={context} />
      <BoardToolbar
        query={filterState.query}
        onQueryChange={(query) =>
          setFilterState((state) => ({ ...state, query }))
        }
        positions={filterState.positions}
        onPositionsChange={(positions) =>
          setFilterState((state) => ({ ...state, positions }))
        }
        availableOnly={filterState.availableOnly}
        onAvailableOnlyChange={(availableOnly) =>
          setFilterState((state) => ({ ...state, availableOnly }))
        }
        matchCount={visiblePlayers.length}
        totalCount={players.length}
      />
      <PlayerTable
        players={visiblePlayers}
        sortKey={filterState.sortKey}
        sortDirection={filterState.sortDirection}
        onSortChange={handleSortChange}
        totalCount={players.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />
    </div>
  )
}
