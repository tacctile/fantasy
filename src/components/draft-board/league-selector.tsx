'use client'

import { useRouter } from 'next/navigation'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ConnectedLeague } from '@/services/draft-board'

interface LeagueSelectorProps {
  /** Every connected league, either platform — never a hardcoded count. */
  leagues: ConnectedLeague[]
  activeLeagueId: string
}

/**
 * Switches the board between connected leagues by league_id. Selection is a
 * route change, so the board re-fetches server-side for the chosen league —
 * no client-side cross-league state to leak between boards.
 */
export default function LeagueSelector({
  leagues,
  activeLeagueId,
}: LeagueSelectorProps) {
  const router = useRouter()

  return (
    <Select
      value={activeLeagueId}
      onValueChange={(leagueId) => {
        if (typeof leagueId === 'string' && leagueId !== activeLeagueId) {
          router.push(`/leagues/${leagueId}/draft`)
        }
      }}
    >
      <SelectTrigger aria-label="Select league" className="w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {leagues.map((league) => (
          <SelectItem key={league.leagueId} value={league.leagueId}>
            {league.name ?? 'Unnamed league'}{' '}
            <span className="text-muted-foreground tabular-nums">
              {league.seasonYear}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
