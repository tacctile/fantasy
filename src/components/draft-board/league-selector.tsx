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
  /** Path under /leagues/<id> the switch lands on — '/draft' for the draft
   *  board, '' for the dashboard (the league root). A string, not a
   *  function: this is a client component, so a server caller can only pass
   *  serializable props (generalized for Wave 4 reuse, Nick-signed). */
  subPath: string
}

/**
 * Switches the active admin surface between connected leagues by league_id.
 * Selection is a route change, so the surface re-fetches server-side for the
 * chosen league — no client-side cross-league state to leak between leagues.
 * Query params deliberately don't survive the switch (another league has its
 * own week range and players).
 */
export default function LeagueSelector({
  leagues,
  activeLeagueId,
  subPath,
}: LeagueSelectorProps) {
  const router = useRouter()

  return (
    <Select
      value={activeLeagueId}
      onValueChange={(leagueId) => {
        if (typeof leagueId === 'string' && leagueId !== activeLeagueId) {
          router.push(`/leagues/${leagueId}${subPath}`)
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
