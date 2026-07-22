import type { MatchupsData } from '@/services/dashboard'

import MatchupCard from './matchup-card'
import WeekSelector from './week-selector'

interface MatchupsGridProps {
  data: MatchupsData
  /** Weeks the selector offers — the page decides the range. */
  weeks: number[]
}

/**
 * One week's matchups for the admin dashboard: URL-driven week selector,
 * head-to-head pairs as mirrored cards in a responsive grid, then unpaired
 * sides (byes, plus any rows the service degraded out of anomalous groups —
 * flagged with a muted notice, never silently forced into pairs). An empty
 * week renders the honest unsynced/unplayed state, not an error.
 */
export default function MatchupsGrid({ data, weeks }: MatchupsGridProps) {
  const isEmpty = data.pairs.length === 0 && data.unpaired.length === 0
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Week {data.week}
        </h2>
        <WeekSelector weeks={weeks} selectedWeek={data.week} />
      </div>
      {isEmpty ? (
        <div className="rounded-xl bg-card px-3 py-8 text-center text-sm text-muted-foreground">
          No matchups synced for week {data.week}.
        </div>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            {data.pairs.map((pair) => (
              <MatchupCard
                key={pair.nativeMatchupId}
                sides={pair.sides}
                week={data.week}
              />
            ))}
          </div>
          {data.hasPairingAnomaly && (
            <p className="text-xs text-muted-foreground">
              Some of this week&apos;s matchup rows couldn&apos;t be paired
              cleanly and are shown individually below.
            </p>
          )}
          {data.unpaired.length > 0 && (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.unpaired.map((side) => (
                <MatchupCard
                  key={side.nativeRosterId}
                  sides={[side]}
                  week={data.week}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
