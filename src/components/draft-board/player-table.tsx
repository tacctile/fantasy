'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { DraftBoardPlayer } from '@/services/draft-board'

import PlayerRow from './player-row'
import type { SortDirection, SortKey } from './use-player-list'

interface PlayerTableProps {
  players: DraftBoardPlayer[]
  sortKey: SortKey
  sortDirection: SortDirection
  onSortChange: (key: SortKey) => void
}

const SORTABLE_COLUMNS: Array<{
  key: SortKey
  label: string
  align: 'left' | 'right'
}> = [
  { key: 'name', label: 'Player', align: 'left' },
  { key: 'adp', label: 'ADP', align: 'right' },
  { key: 'posRank', label: 'Pos rank', align: 'right' },
]

function SortableHeader({
  column,
  sortKey,
  sortDirection,
  onSortChange,
}: {
  column: (typeof SORTABLE_COLUMNS)[number]
  sortKey: SortKey
  sortDirection: SortDirection
  onSortChange: (key: SortKey) => void
}) {
  const active = sortKey === column.key
  return (
    <th
      scope="col"
      aria-sort={
        active
          ? sortDirection === 'asc'
            ? 'ascending'
            : 'descending'
          : undefined
      }
      className={cn(
        'px-3 py-2',
        column.align === 'right' ? 'text-right' : 'text-left'
      )}
    >
      <button
        type="button"
        onClick={() => onSortChange(column.key)}
        className={cn(
          'inline-flex items-center gap-1 rounded-full text-xs font-medium uppercase tracking-wide transition-colors',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-secondary-foreground'
        )}
      >
        {column.label}
        {active &&
          (sortDirection === 'asc' ? (
            <ChevronUp aria-hidden className="size-3" />
          ) : (
            <ChevronDown aria-hidden className="size-3" />
          ))}
      </button>
    </th>
  )
}

/**
 * The draft board's player grid — one of the app's two sanctioned true
 * tabular surfaces (DESIGN_SYSTEM.md; the other is standings). Header cells
 * for ADP, positional rank, and name toggle sort via `onSortChange`;
 * non-sortable columns render plain labels.
 */
export default function PlayerTable({
  players,
  sortKey,
  sortDirection,
  onSortChange,
}: PlayerTableProps) {
  const [nameColumn, adpColumn, posRankColumn] = SORTABLE_COLUMNS
  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-card">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b">
            <SortableHeader
              column={nameColumn}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
            />
            <th
              scope="col"
              className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Pos
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Team
            </th>
            <SortableHeader
              column={adpColumn}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
            />
            <SortableHeader
              column={posRankColumn}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
            />
            <th
              scope="col"
              className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            // Minimal functional fallback only — the designed zero-match
            // empty state (with a clear next action) is the next
            // sub-section's registered item.
            <tr>
              <td
                colSpan={6}
                className="px-3 py-8 text-center text-sm text-muted-foreground"
              >
                No players match the active filters.
              </td>
            </tr>
          ) : (
            players.map((player) => (
              <PlayerRow key={player.sleeperPlayerId} player={player} />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
