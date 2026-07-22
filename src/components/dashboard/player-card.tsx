import InjuryChip from '@/components/draft-board/injury-chip'
import PositionBadge from '@/components/draft-board/position-badge'
import type { PlayerCardData, PlayerCardWeekEntry } from '@/services/dashboard'

import AsOfTime from './as-of-time'
import UnofficialChip from './unofficial-chip'

interface PlayerCardProps {
  data: PlayerCardData
}

function latestFetchedAt(weeks: PlayerCardWeekEntry[]): string | null {
  let latest: string | null = null
  for (const entry of weeks) {
    if (
      entry.status === 'scored' &&
      entry.fetchedAt !== null &&
      (latest === null || entry.fetchedAt > latest)
    ) {
      latest = entry.fetchedAt
    }
  }
  return latest
}

/**
 * One scored week's line: week number, points (bold, the row's anchor),
 * bench tag for non-starter weeks, the holding roster (player_scores is the
 * only historical attribution record — mid-season moves show here), and the
 * unofficial chip when non-final. A not_rostered entry is the Nick-signed
 * FA-week gap rendered honestly — muted, never an invented zero.
 */
function WeekLine({ entry }: { entry: PlayerCardWeekEntry }) {
  if (entry.status === 'not_rostered') {
    return (
      <li className="flex items-baseline gap-3 px-3 py-1.5">
        <span className="w-8 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
          {entry.week}
        </span>
        <span className="text-sm text-muted-foreground">Not rostered</span>
      </li>
    )
  }
  return (
    <li className="flex items-baseline gap-3 px-3 py-1.5">
      <span className="w-8 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
        {entry.week}
      </span>
      <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums">
        {entry.points.toFixed(2)}
      </span>
      <span className="w-12 shrink-0 text-xs text-muted-foreground">
        {entry.wasStarter ? '' : 'bench'}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
        {entry.teamName ?? entry.ownerDisplayName ?? `Roster ${entry.nativeRosterId}`}
      </span>
      <UnofficialChip isFinal={entry.isFinal} />
    </li>
  )
}

/**
 * Player detail panel for the admin dashboard (presentational — the page
 * decides how it opens): Sleeper-anchored identity with roster-status and
 * injury designation shown as the independent fields they are (never
 * collapsed — sleeper-api/player-data-quirks), current roster/availability
 * in this league, and the per-week score line with FA-gap weeks rendered
 * honestly. No charts — Wave 5 scope.
 */
export default function PlayerCard({ data }: PlayerCardProps) {
  const { player, rosterStatus, weeks } = data
  const fetchedAt = latestFetchedAt(weeks)
  const showStatus = player.status !== null && player.status !== 'Active'
  return (
    <div className="rounded-xl bg-card p-4">
      <div className="flex items-start gap-3">
        <PositionBadge position={player.position} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-lg font-bold">
              {player.fullName ?? player.sleeperPlayerId}
            </span>
            <InjuryChip injuryStatus={player.injuryStatus} />
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {player.team ?? 'No team'}
            {showStatus && ` · ${player.status}`}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm">
        {rosterStatus.availability === 'rostered' ? (
          <>
            <span className="text-secondary-foreground">Rostered by </span>
            <span className="font-semibold">
              {rosterStatus.teamName ??
                rosterStatus.ownerDisplayName ??
                `Roster ${rosterStatus.nativeRosterId}`}
            </span>
            <span className="text-xs text-muted-foreground">
              {' '}
              · {rosterStatus.slot}
            </span>
          </>
        ) : (
          <span className="text-secondary-foreground">Available</span>
        )}
      </p>
      <div className="mt-3 border-t border-border/50 pt-2">
        <h3 className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {data.context.seasonYear} weeks
        </h3>
        {weeks.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No scored weeks in this league yet.
          </p>
        ) : (
          <ol className="mt-1">
            {weeks.map((entry) => (
              <WeekLine key={entry.week} entry={entry} />
            ))}
          </ol>
        )}
      </div>
      {fetchedAt !== null && (
        <div className="mt-2">
          <AsOfTime fetchedAt={fetchedAt} />
        </div>
      )}
    </div>
  )
}
