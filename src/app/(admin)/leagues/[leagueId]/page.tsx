import { notFound } from 'next/navigation'

import LeagueDashboardShell from '@/components/dashboard/league-dashboard-shell'
import PlayerCard from '@/components/dashboard/player-card'
import PlayerCardSheet from '@/components/dashboard/player-card-sheet'
import LeagueSelector from '@/components/draft-board/league-selector'
import { createClient } from '@/lib/supabase/server'
import {
  getMatchups,
  getPlayerCard,
  getPowerRankings,
  getStandings,
  listScoredWeeks,
} from '@/services/dashboard'
import { listConnectedLeagues } from '@/services/draft-board'

const MIN_WEEK = 1
const MAX_WEEK = 18

/** First value when Next hands back an array; undefined stays undefined. */
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/**
 * `?week=N` when it's a valid week number, else null — an unparseable or
 * out-of-range value falls back to the default week rather than erroring
 * (a hand-typed URL is not a failure; the selector only offers real weeks).
 */
function parseWeekParam(value: string | undefined): number | null {
  if (value === undefined || !/^\d{1,2}$/.test(value)) return null
  const week = Number(value)
  return week >= MIN_WEEK && week <= MAX_WEEK ? week : null
}

/**
 * Admin league dashboard (Wave 4): standings, matchups, power rankings, and
 * the URL-driven player-card sheet for any connected league — no hardcoded
 * league count. Server Component reading through the RLS server client as
 * the signed-in admin (same posture as the draft board — never the
 * service-role client). Default week is the latest league-scored week: with
 * current-week-only scheduled syncs that is the in-season current week, and
 * the final week for a complete season. Unknown/malformed league → 404 via
 * the data layer's typed not-found, never a partial response.
 */
export default async function LeagueDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams])
  const db = await createClient()

  const [standingsResult, powerRankingsResult, weeks, leagues] =
    await Promise.all([
      getStandings(db, leagueId),
      getPowerRankings(db, leagueId),
      listScoredWeeks(db, leagueId),
      listConnectedLeagues(db),
    ])
  if (!standingsResult.ok || !powerRankingsResult.ok) notFound()

  const defaultWeek = weeks.length > 0 ? weeks[weeks.length - 1] : MIN_WEEK
  const week = parseWeekParam(firstParam(query.week)) ?? defaultWeek

  const matchupsResult = await getMatchups(db, leagueId, week)
  if (!matchupsResult.ok) notFound()

  const playerId = firstParam(query.player)
  const playerResult =
    playerId === undefined ? null : await getPlayerCard(db, playerId, leagueId)
  if (playerResult !== null && !playerResult.ok) {
    if (playerResult.reason === 'league_not_found') notFound()
  }
  const closeHref = `/leagues/${leagueId}?week=${week}`

  return (
    <>
      <LeagueDashboardShell
        standings={standingsResult.data}
        matchups={matchupsResult.data}
        powerRankings={powerRankingsResult.data}
        weeks={weeks}
        headerActions={
          <LeagueSelector
            leagues={leagues}
            activeLeagueId={leagueId}
            subPath=""
          />
        }
      />
      {playerResult !== null &&
        (playerResult.ok ? (
          <PlayerCardSheet
            closeHref={closeHref}
            label={
              playerResult.data.player.fullName ??
              playerResult.data.player.sleeperPlayerId
            }
          >
            <PlayerCard data={playerResult.data} />
          </PlayerCardSheet>
        ) : (
          <PlayerCardSheet closeHref={closeHref} label="Player not found">
            <div className="rounded-xl bg-card px-3 py-8 text-center text-sm text-muted-foreground">
              No player matches this link.
            </div>
          </PlayerCardSheet>
        ))}
    </>
  )
}
