interface AsOfTimeProps {
  /** `fetched_at` ISO timestamp — null (never-synced) renders nothing. */
  fetchedAt: string | null
}

// Deterministic UTC rendering: these are server components, and an explicit
// zone label is honest everywhere Nick opens the dashboard from.
const FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
})

/**
 * Section-level "as of <time> UTC" caption from the freshness machinery
 * (Nick-signed 2026-07-22 pairing with UnofficialChip): the caption says
 * when the data was fetched, the chip says whether it's final — together
 * stale or non-final scores are never silently presented as current.
 */
export default function AsOfTime({ fetchedAt }: AsOfTimeProps) {
  if (fetchedAt === null) return null
  const parsed = new Date(fetchedAt)
  if (Number.isNaN(parsed.getTime())) return null
  return (
    <span className="text-xs text-muted-foreground">
      as of {FORMATTER.format(parsed)} UTC
    </span>
  )
}
