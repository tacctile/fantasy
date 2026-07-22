import SignOutButton from '@/components/auth/sign-out-button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type {
  ConnectedLeague,
  DraftBoardLeagueContext,
} from '@/services/draft-board'

import LeagueSelector from './league-selector'

interface DraftBoardHeaderProps {
  context: DraftBoardLeagueContext
  leagues: ConnectedLeague[]
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
 * Board header/toolbar: league name, platform badge, season year, the league
 * selector, and the active ADP source with its last successful ingestion time
 * (adp_rankings rows only ever exist from a fully validated ingestion —
 * validate-before-swap — so the snapshot's ingested_at IS that time).
 */
export default function DraftBoardHeader({
  context,
  leagues,
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
        <LeagueSelector
          leagues={leagues}
          activeLeagueId={context.leagueId}
          subPath="/draft"
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
        <Separator orientation="vertical" className="h-5" />
        <SignOutButton />
      </div>
    </header>
  )
}
