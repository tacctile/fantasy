import { ArrowUpRight, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { PowerRankingsData, StandingsData } from '@/services/dashboard'

interface CommandCenterHomeProps {
  leagueId: string
  standings: StandingsData
  powerRankings: PowerRankingsData
}

const SNAPSHOT_ROWS = 3

/** Team label preference: team name → owner → the roster id as a last resort. */
function teamLabel(team: {
  teamName: string | null
  ownerDisplayName: string | null
  nativeRosterId: number
}): string {
  return team.teamName ?? team.ownerDisplayName ?? `Team ${team.nativeRosterId}`
}

/** "W-L" or "W-L-T" when there are ties. */
function record(team: { wins: number; losses: number; ties: number }): string {
  return team.ties > 0
    ? `${team.wins}-${team.losses}-${team.ties}`
    : `${team.wins}-${team.losses}`
}

const EMPTY_NOTE =
  'text-sm text-muted-foreground'
const DEEP_LINK =
  'flex w-full items-center justify-between text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'

/**
 * Admin command-center home (Wave 4 nav-shell sub-section, item 2). The league
 * root's landing surface: one lightweight snapshot card per major feature area
 * that exists today — standings and power rankings (Wave 5's luck/waiver/
 * playoff/trade cards mount here as those features ship) plus a deep-link into
 * the draft board — each card linking into its own full page. This is what
 * makes a 2-minute "quick check" work without full navigation. Reads the same
 * services/dashboard.ts results the full dashboard renders — never a second
 * ordering or formula. Empty arrays are the honest pre-sync state, not errors.
 */
export default function CommandCenterHome({
  leagueId,
  standings,
  powerRankings,
}: CommandCenterHomeProps) {
  const { context } = standings
  const topStandings = standings.teams.slice(0, SNAPSHOT_ROWS)
  const topPower = powerRankings.teams.slice(0, SNAPSHOT_ROWS)

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">
            {context.name ?? 'Unnamed league'}
          </h1>
          <Badge variant="secondary" className="uppercase">
            {context.platform}
          </Badge>
          <span className="text-sm text-muted-foreground tabular-nums">
            {context.seasonYear}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">Command center</span>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Standings snapshot */}
          <Card>
            <CardHeader>
              <CardTitle>Standings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              {topStandings.length === 0 ? (
                <p className={EMPTY_NOTE}>
                  No standings yet — run a league sync to populate this league.
                </p>
              ) : (
                topStandings.map((team) => (
                  <div
                    key={team.nativeRosterId}
                    className="flex items-baseline gap-2"
                  >
                    <span className="w-5 text-right text-muted-foreground tabular-nums">
                      {team.rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {teamLabel(team)}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {record(team)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter>
              <Link href={`/leagues/${leagueId}/dashboard`} className={DEEP_LINK}>
                View standings &amp; matchups
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </CardFooter>
          </Card>

          {/* Power-rankings snapshot */}
          <Card>
            <CardHeader>
              <CardTitle>Power Rankings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              {powerRankings.lowConfidence && topPower.length > 0 && (
                <p className="pb-1 text-xs text-muted-foreground">
                  Provisional — under 6 weeks counted.
                </p>
              )}
              {topPower.length === 0 ? (
                <p className={EMPTY_NOTE}>
                  No games scored yet — rankings appear once weeks are played.
                </p>
              ) : (
                topPower.map((team) => (
                  <div
                    key={team.nativeRosterId}
                    className="flex items-baseline gap-2"
                  >
                    <span className="w-5 text-right text-muted-foreground tabular-nums">
                      {team.rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {teamLabel(team)}
                    </span>
                    {team.rankDelta !== null && team.rankDelta !== 0 && (
                      <span className="flex items-center text-muted-foreground tabular-nums">
                        {team.rankDelta > 0 ? (
                          <ChevronUp className="size-3.5" aria-hidden />
                        ) : (
                          <ChevronDown className="size-3.5" aria-hidden />
                        )}
                        {Math.abs(team.rankDelta)}
                      </span>
                    )}
                    <span className="w-12 text-right text-muted-foreground tabular-nums">
                      {(team.allPlayWinPct * 100).toFixed(1)}%
                    </span>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter>
              <Link href={`/leagues/${leagueId}/dashboard`} className={DEEP_LINK}>
                View full power rankings
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </CardFooter>
          </Card>

          {/* Draft board deep-link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
                Draft Board
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={EMPTY_NOTE}>
                Live draft board with best-available recommendations, tier and
                run detection, and the draft queue with auto-pick.
              </p>
            </CardContent>
            <CardFooter>
              <Link href={`/leagues/${leagueId}/draft`} className={DEEP_LINK}>
                Open draft board
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
