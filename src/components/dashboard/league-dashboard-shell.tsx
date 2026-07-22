import Link from 'next/link'

import SignOutButton from '@/components/auth/sign-out-button'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import type {
  MatchupsData,
  PowerRankingsData,
  StandingsData,
} from '@/services/dashboard'

import MatchupsGrid from './matchups-grid'
import PowerRankingsList from './power-rankings-list'
import StandingsTable from './standings-table'

interface LeagueDashboardShellProps {
  standings: StandingsData
  matchups: MatchupsData
  powerRankings: PowerRankingsData
  /** Weeks the selector offers — the page's listScoredWeeks result. */
  weeks: number[]
  /** Header slot for the league selector (item 2 of this sub-section); the
   *  shell owns no cross-league data itself. */
  headerActions?: React.ReactNode
}

const SECTION_HEADING =
  'text-sm font-medium uppercase tracking-wide text-muted-foreground'

/**
 * Admin league dashboard composition (tablet/PC-first, Nick-signed layout):
 * header with league identity, then the current week's matchups full-width —
 * the "what's happening" surface — with standings and power rankings
 * side-by-side beneath on wide screens, stacked on narrow. Pure composition:
 * every ordering, pairing, and delta renders the dashboard service's results
 * as-is (services/dashboard.ts is their single home). The player-card sheet
 * is the page's concern (URL-driven), not the shell's.
 */
export default function LeagueDashboardShell({
  standings,
  matchups,
  powerRankings,
  weeks,
  headerActions,
}: LeagueDashboardShellProps) {
  const { context } = standings
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
        <div className="ml-auto flex items-center gap-3">
          {headerActions}
          <Link
            href={`/leagues/${context.leagueId}/draft`}
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          >
            Draft board
          </Link>
          <SignOutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-6 p-4">
        <section aria-label="Matchups">
          <MatchupsGrid data={matchups} weeks={weeks} />
        </section>
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-label="Standings" className="flex flex-col gap-3">
            <h2 className={SECTION_HEADING}>Standings</h2>
            <StandingsTable data={standings} />
          </section>
          <section aria-label="Power rankings" className="flex flex-col gap-3">
            <h2 className={SECTION_HEADING}>Power rankings</h2>
            <PowerRankingsList data={powerRankings} />
          </section>
        </div>
      </main>
    </div>
  )
}
