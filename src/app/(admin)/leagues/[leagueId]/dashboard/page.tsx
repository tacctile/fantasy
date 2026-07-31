import type { SupabaseClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

import LeagueDashboardShell from '@/components/dashboard/league-dashboard-shell'
import PlayerCard from '@/components/dashboard/player-card'
import PlayerCardSheet from '@/components/dashboard/player-card-sheet'
import SectionUnavailable from '@/components/dashboard/section-unavailable'
import ShareLinkPanel from '@/components/dashboard/share-link-panel'
import type { Database } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'
import {
  firstContext,
  getMatchups,
  getPlayerCard,
  getPowerRankings,
  getStandings,
  listScoredWeeks,
  SECTION_UNAVAILABLE,
  settleQuery,
  toSection,
} from '@/services/dashboard'

const MIN_WEEK = 1
const MAX_WEEK = 18

/**
 * The league's `share_token`, read here (not through services/dashboard.ts,
 * whose boundary deliberately never selects it) because this is the one
 * owner-authenticated surface that manages the spectator link. Gated by the
 * (admin) layout + the owner RLS policy on `leagues`; the token never leaves
 * this admin page except into the owner-only ShareLinkPanel. Null only if the
 * row is somehow unreadable (the layout already 404s unknown leagues) — the
 * panel is then simply not rendered rather than crashing the dashboard.
 */
async function fetchShareToken(
  db: SupabaseClient<Database>,
  leagueId: string
): Promise<string | null> {
  const { data, error } = await db
    .from('leagues')
    .select('share_token')
    .eq('platform_league_uuid', leagueId)
    .maybeSingle()
  if (error) throw new Error(`share-token query failed: ${error.message}`)
  return data?.share_token ?? null
}

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
 * league count. Server Component reading through the RLS server client as the
 * signed-in admin (same posture as the draft board — never the service-role
 * client). Moved to /leagues/[id]/dashboard by the nav-shell sub-section (the
 * league root is now the command-center home); the persistent sidebar (this
 * segment's layout) owns the league selector and sign-out, so this page's
 * header carries only the league's own identity. Default week is the latest
 * league-scored week: with current-week-only scheduled syncs that is the
 * in-season current week, and the final week for a complete season.
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

  const [standingsResult, powerRankingsResult, weeks, shareToken] =
    await Promise.all([
      settleQuery('standings', getStandings(db, leagueId), SECTION_UNAVAILABLE),
      settleQuery(
        'powerRankings',
        getPowerRankings(db, leagueId),
        SECTION_UNAVAILABLE
      ),
      settleQuery('scoredWeeks', listScoredWeeks(db, leagueId), []),
      settleQuery('shareToken', fetchShareToken(db, leagueId), null),
    ])
  if (
    (!standingsResult.ok && standingsResult.reason === 'league_not_found') ||
    (!powerRankingsResult.ok &&
      powerRankingsResult.reason === 'league_not_found')
  ) {
    notFound()
  }

  const defaultWeek = weeks.length > 0 ? weeks[weeks.length - 1] : MIN_WEEK
  const week = parseWeekParam(firstParam(query.week)) ?? defaultWeek

  const matchupsResult = await settleQuery(
    'matchups',
    getMatchups(db, leagueId, week),
    SECTION_UNAVAILABLE
  )
  if (!matchupsResult.ok && matchupsResult.reason === 'league_not_found') {
    notFound()
  }

  const standings = toSection(standingsResult)
  const powerRankings = toSection(powerRankingsResult)
  const matchups = toSection(matchupsResult)
  const context = firstContext([standings, powerRankings, matchups])
  // Every section failed: no league identity to render a header with, so this
  // is a whole-page failure — the route error boundary owns it from here.
  if (context === null) throw new Error('league dashboard: all sections failed')

  const playerId = firstParam(query.player)
  const playerResult =
    playerId === undefined
      ? null
      : await settleQuery(
          'playerCard',
          getPlayerCard(db, playerId, leagueId),
          SECTION_UNAVAILABLE
        )
  if (playerResult !== null && !playerResult.ok) {
    if (playerResult.reason === 'league_not_found') notFound()
  }
  const closeHref = `/leagues/${leagueId}/dashboard?week=${week}`

  return (
    <>
      <LeagueDashboardShell
        context={context}
        standings={standings}
        matchups={matchups}
        powerRankings={powerRankings}
        weeks={weeks}
        settingsSlot={
          shareToken === null ? undefined : (
            <ShareLinkPanel leagueId={leagueId} shareToken={shareToken} />
          )
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
        ) : playerResult.reason === 'unavailable' ? (
          <PlayerCardSheet closeHref={closeHref} label="Player unavailable">
            <SectionUnavailable label="This player's details" />
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
