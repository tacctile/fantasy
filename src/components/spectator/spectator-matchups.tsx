import type { MatchupsData } from '@/services/dashboard'

import SpectatorMatchupCard from './spectator-matchup-card'

interface SpectatorMatchupsProps {
  /** The current (latest scored) week's matchups, or null when the league has
   *  nothing scored yet. */
  data: MatchupsData | null
}

/**
 * Spectator matchups — the current week only, stacked vertically for a phone,
 * with no week-navigation control of any kind (build-file scope; the page
 * ignores a hand-typed `?week=` entirely, per Nick's Clarify, so there is no
 * hidden week capability behind the missing control either).
 *
 * Unpaired sides (byes, plus any rows the service degraded out of anomalous
 * groups) render as single-side cards. The service's pairing anomaly flag is
 * not surfaced as a warning here — that is admin diagnostic noise; the rows
 * themselves still appear, never silently forced into pairs.
 */
export default function SpectatorMatchups({ data }: SpectatorMatchupsProps) {
  if (data === null) {
    return (
      <div className="rounded-xl bg-card px-3 py-8 text-center text-sm text-muted-foreground">
        No scored weeks in this league yet.
      </div>
    )
  }
  if (data.pairs.length === 0 && data.unpaired.length === 0) {
    return (
      <div className="rounded-xl bg-card px-3 py-8 text-center text-sm text-muted-foreground">
        No matchups for week {data.week} yet.
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {data.pairs.map((pair) => (
        <SpectatorMatchupCard key={pair.nativeMatchupId} sides={pair.sides} />
      ))}
      {data.unpaired.map((side) => (
        <SpectatorMatchupCard key={side.nativeRosterId} sides={[side]} />
      ))}
    </div>
  )
}
