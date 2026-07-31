import { Badge } from '@/components/ui/badge'
import type {
  DashboardLeagueContext,
  MatchupsData,
  PowerRankingsData,
  SectionOutcome,
  StandingsData,
} from '@/services/dashboard'

import MatchupsGrid from './matchups-grid'
import PowerRankingsList from './power-rankings-list'
import SectionUnavailable from './section-unavailable'
import StandingsTable from './standings-table'

interface LeagueDashboardShellProps {
  /** League identity for the header — resolved by the page from whichever
   *  section loaded, so the header survives a failing section. */
  context: DashboardLeagueContext
  standings: SectionOutcome<StandingsData>
  matchups: SectionOutcome<MatchupsData>
  powerRankings: SectionOutcome<PowerRankingsData>
  /** Weeks the selector offers — the page's listScoredWeeks result. */
  weeks: number[]
  /** Owner-only settings block rendered at the bottom of the dashboard flow
   *  (the share-link panel). A layout slot — the shell stays agnostic about
   *  its contents, keeping the admin-settings concern out of the pure data
   *  composition above. */
  settingsSlot?: React.ReactNode
}

const SECTION_HEADING =
  'text-sm font-medium uppercase tracking-wide text-muted-foreground'

/**
 * Admin league dashboard composition (tablet/PC-first, Nick-signed layout):
 * a slim league-identity header, then the current week's matchups full-width —
 * the "what's happening" surface — with standings and power rankings
 * side-by-side beneath on wide screens, stacked on narrow. Pure composition:
 * every ordering, pairing, and delta renders the dashboard service's results
 * as-is (services/dashboard.ts is their single home). The player-card sheet
 * is the page's concern (URL-driven), not the shell's. The league selector,
 * draft-board link, and sign-out moved to the persistent sidebar (nav-shell
 * sub-section) — the shell no longer duplicates that global chrome.
 *
 * Each section arrives as its own `SectionOutcome`: a section whose query
 * failed renders an inline notice while its neighbours render real data
 * (Nick's Clarify, 2026-07-31) — emptiness stays the components' own honest
 * empty state, which is a different thing entirely.
 */
export default function LeagueDashboardShell({
  context,
  standings,
  matchups,
  powerRankings,
  weeks,
  settingsSlot,
}: LeagueDashboardShellProps) {
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
      </header>
      <main className="flex flex-1 flex-col gap-6 p-4">
        <section aria-label="Matchups">
          {matchups.status === 'ok' ? (
            <MatchupsGrid data={matchups.data} weeks={weeks} />
          ) : (
            <div className="flex flex-col gap-3">
              <h2 className={SECTION_HEADING}>Matchups</h2>
              <SectionUnavailable label="This week's matchups" />
            </div>
          )}
        </section>
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-label="Standings" className="flex flex-col gap-3">
            <h2 className={SECTION_HEADING}>Standings</h2>
            {standings.status === 'ok' ? (
              <StandingsTable data={standings.data} />
            ) : (
              <SectionUnavailable label="Standings" />
            )}
          </section>
          <section aria-label="Power rankings" className="flex flex-col gap-3">
            <h2 className={SECTION_HEADING}>Power rankings</h2>
            {powerRankings.status === 'ok' ? (
              <PowerRankingsList data={powerRankings.data} />
            ) : (
              <SectionUnavailable label="Power rankings" />
            )}
          </section>
        </div>
        {settingsSlot !== undefined && (
          <section aria-label="League settings" className="max-w-2xl">
            {settingsSlot}
          </section>
        )}
      </main>
    </div>
  )
}
