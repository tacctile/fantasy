import { Badge } from '@/components/ui/badge'
import ErrorBoundary from '@/components/ui/error-boundary'
import { Separator } from '@/components/ui/separator'
import type { DraftBoardLeagueContext } from '@/services/draft-board'
import type { DraftSessionState } from '@/services/draft-sessions'

import DraftSessionToggle from './draft-session-toggle'
import LiveStatusIndicator from './live-status-indicator'
import type { LivePollHealth } from './live-status'

interface DraftBoardHeaderProps {
  context: DraftBoardLeagueContext
  session: DraftSessionState
  /** Aggregated poll health from the shell (live sync item 5). */
  pollHealth: LivePollHealth
}

// Fixed locale + UTC keeps server and client renders identical (no hydration
// mismatch) and honest about what ingested_at is — a UTC instant, not local.
const INGESTED_AT_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/**
 * Board header/toolbar: league name, platform badge, season year, the draft
 * session control with its live status, and the active ADP source with its
 * last successful ingestion time (adp_rankings rows only ever exist from a
 * fully validated ingestion — validate-before-swap — so the snapshot's
 * ingested_at IS that time). The league selector and sign-out moved to the
 * persistent admin sidebar (Wave 4 nav-shell) — the board no longer duplicates
 * that global chrome.
 */
export default function DraftBoardHeader({
  context,
  session,
  pollHealth,
}: DraftBoardHeaderProps) {
  return (
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
        <DraftSessionToggle
          session={session}
          statusSlot={
            // Resilience item 1: the live status indicator degrades to nothing
            // on a render fault (a supplementary indicator, not board content)
            // rather than taking down the header; recovers on the next tick.
            <ErrorBoundary fallback={null} resetKeys={[pollHealth]}>
              <LiveStatusIndicator session={session} health={pollHealth} />
            </ErrorBoundary>
          }
        />
        <Separator orientation="vertical" className="h-5" />
        <p className="text-sm text-muted-foreground">
          ADP: {context.adpSource}
          {' · '}
          {context.adpIngestedAt === null ? (
            'no ADP ingested'
          ) : (
            <span className="tabular-nums">
              {INGESTED_AT_FORMAT.format(new Date(context.adpIngestedAt))} UTC
            </span>
          )}
        </p>
      </div>
    </header>
  )
}
