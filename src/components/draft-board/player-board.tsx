'use client'

import { useState } from 'react'

import type { DraftBoardPlayer } from '@/services/draft-board'

import BoardToolbar from './board-toolbar'
import PlayerTable from './player-table'
import {
  DEFAULT_FILTER_STATE,
  usePlayerList,
  type PlayerListFilterState,
  type SortKey,
} from './use-player-list'

interface PlayerBoardProps {
  players: DraftBoardPlayer[]
}

/**
 * The board's player-list region: owns the filter/sort state, derives the
 * visible list through the memoized `usePlayerList`, and composes the toolbar
 * over the table. Re-clicking the active sort column flips direction; a new
 * column starts ascending (ADP/rank/name all read best-first ascending).
 */
export default function PlayerBoard({ players }: PlayerBoardProps) {
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

  return (
    <div className="flex h-full min-h-0 flex-col">
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
      />
    </div>
  )
}
