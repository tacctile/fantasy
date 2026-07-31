interface SpectatorAsOfTimeProps {
  /** `fetched_at` ISO timestamp — null (never-synced) renders nothing. */
  fetchedAt: string | null
}

// Deterministic UTC rendering, same reasoning as the admin caption: these are
// server components, and an explicit zone label is honest for a leaguemate
// opening the link from anywhere.
const FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
})

/**
 * "as of <time> UTC" caption for the spectator surface — spectator-local by
 * the same separate-rendering-path rule as the unofficial chip. Paired with
 * that chip: the caption says when the data was fetched, the chip says whether
 * it's final.
 */
export default function SpectatorAsOfTime({ fetchedAt }: SpectatorAsOfTimeProps) {
  if (fetchedAt === null) return null
  const parsed = new Date(fetchedAt)
  if (Number.isNaN(parsed.getTime())) return null
  return (
    <span className="text-xs text-muted-foreground">
      as of {FORMATTER.format(parsed)} UTC
    </span>
  )
}
