import type { SpectatorDashboardData } from '@/services/spectator'

import SpectatorMatchups from './spectator-matchups'
import SpectatorPowerRankings from './spectator-power-rankings'
import SpectatorStandings from './spectator-standings'

interface SpectatorShellProps {
  data: SpectatorDashboardData
  /** The player drawer when `?player=` is present — a layout slot, so the
   *  shell stays a pure synchronous composition (and stays renderable in the
   *  no-admin-markup boundary test without a database). */
  playerSlot?: React.ReactNode
}

const SECTION_HEADING =
  'text-xs font-medium uppercase tracking-wide text-muted-foreground'

/**
 * Read-only spectator dashboard composition (mobile-first, single column):
 * league identity header, then this week's matchups — what someone opens a
 * share link mid-week to see — then standings, then power rankings (Nick's
 * Clarify order).
 *
 * This is a genuinely separate rendering path, not the admin view with
 * controls hidden (MASTER_CONTEXT Access Model): it imports zero components
 * from `components/dashboard` or `components/draft-board`, carries no league
 * selector, no week selector, no share-link/regenerate control, no sign-out,
 * no nav shell, and no login or auth affordance of any kind. Only types and
 * the data-access layer are shared with the admin surface.
 */
export default function SpectatorShell({ data, playerSlot }: SpectatorShellProps) {
  const { context } = data
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-3 py-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">
          {context.name ?? 'Unnamed league'}
        </h1>
        <span className="flex items-center gap-2">
          <span className="inline-flex h-5 items-center rounded-full bg-secondary px-2 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
            {context.platform}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {context.seasonYear} season
          </span>
        </span>
      </header>

      <section aria-label="Matchups" className="flex flex-col gap-2">
        <h2 className={SECTION_HEADING}>
          {data.week === null ? 'Matchups' : `Week ${data.week}`}
        </h2>
        <SpectatorMatchups data={data.matchups} />
      </section>

      <section aria-label="Standings" className="flex flex-col gap-2">
        <h2 className={SECTION_HEADING}>Standings</h2>
        <SpectatorStandings data={data.standings} />
      </section>

      <section aria-label="Power rankings" className="flex flex-col gap-2">
        <h2 className={SECTION_HEADING}>Power rankings</h2>
        <SpectatorPowerRankings data={data.powerRankings} />
      </section>

      {playerSlot}
    </div>
  )
}
