import type { PlayerCardData, PlayerCardWeekEntry } from '@/services/dashboard'

import SpectatorAsOfTime from './spectator-as-of-time'
import SpectatorUnofficialChip from './spectator-unofficial-chip'

interface SpectatorPlayerCardProps {
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
 * One week's line, simplified for the spectator view: week, points, and the
 * unofficial chip. The admin card's holding-roster attribution column is
 * dropped — a leaguemate wants the scoring line, not the transaction history.
 * A not_rostered entry stays rendered honestly (the Nick-signed FA-week gap),
 * never backfilled with an invented zero.
 */
function WeekLine({ entry }: { entry: PlayerCardWeekEntry }) {
  return (
    <li className="flex items-baseline gap-3 px-3 py-1.5">
      <span className="w-10 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
        Wk {entry.week}
      </span>
      {entry.status === 'not_rostered' ? (
        <span className="text-sm text-muted-foreground">Not rostered</span>
      ) : (
        <>
          <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums">
            {entry.points.toFixed(2)}
          </span>
          <span className="min-w-0 flex-1 text-xs text-muted-foreground">
            {entry.wasStarter ? 'started' : 'bench'}
          </span>
          <SpectatorUnofficialChip isFinal={entry.isFinal} />
        </>
      )}
    </li>
  )
}

/**
 * Lightweight spectator player view: Sleeper-anchored identity, who holds the
 * player in this league, and the per-week scoring line. No admin tooling — no
 * draft/BPA context, no position-color badge, no roster-management affordance.
 *
 * Roster `status` and `injury_status` are read as the two independent fields
 * they are and never collapsed into one availability string
 * (wiki: sleeper-api/player-data-quirks — they can legitimately disagree
 * during transaction windows, and conflating them misclassifies exactly those
 * players).
 */
export default function SpectatorPlayerCard({ data }: SpectatorPlayerCardProps) {
  const { player, rosterStatus, weeks } = data
  const fetchedAt = latestFetchedAt(weeks)
  const showStatus = player.status !== null && player.status !== 'Active'
  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-lg font-bold">
            {player.fullName ?? player.sleeperPlayerId}
          </span>
          {player.injuryStatus !== null && (
            <span className="inline-flex h-4 shrink-0 items-center rounded-full bg-warning/15 px-1.5 text-[10px] font-semibold uppercase text-warning">
              {player.injuryStatus}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {player.position ?? 'No position'} · {player.team ?? 'No team'}
          {showStatus && ` · ${player.status}`}
        </span>
      </div>

      <p className="text-sm">
        {rosterStatus.availability === 'rostered' ? (
          <>
            <span className="text-secondary-foreground">Rostered by </span>
            <span className="font-semibold">
              {rosterStatus.teamName ??
                rosterStatus.ownerDisplayName ??
                `Roster ${rosterStatus.nativeRosterId}`}
            </span>
          </>
        ) : (
          <span className="text-secondary-foreground">Not on a roster</span>
        )}
      </p>

      <div className="rounded-xl bg-card py-1">
        <h3 className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {data.context.seasonYear} weeks
        </h3>
        {weeks.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No scored weeks in this league yet.
          </p>
        ) : (
          <ol>
            {weeks.map((entry) => (
              <WeekLine key={entry.week} entry={entry} />
            ))}
          </ol>
        )}
      </div>

      {fetchedAt !== null && <SpectatorAsOfTime fetchedAt={fetchedAt} />}
    </div>
  )
}
