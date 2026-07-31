import { AlertTriangle } from 'lucide-react'

interface SectionUnavailableProps {
  /** What failed, in the user's words — "Standings", "This week's matchups". */
  label: string
}

/**
 * Quiet inline notice for a dashboard section whose query failed, so one bad
 * section degrades alone instead of blanking the page (Nick's Clarify,
 * 2026-07-31). Same posture as the draft board's per-region boundaries: the
 * surrounding sections keep rendering their real data.
 *
 * Deliberately says nothing about WHY. Raw error content never renders on any
 * surface (Access Model data-exposure posture) — `settleQuery` logs the cause
 * server-side with its section label, which is where diagnosis happens. Copy
 * distinguishes failure from emptiness: an empty section says "nothing synced
 * yet", this one says the data couldn't be loaded, so a temporary fault is
 * never misread as a league with no data.
 */
export default function SectionUnavailable({ label }: SectionUnavailableProps) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 rounded-xl bg-card px-3 py-8 text-center text-sm text-muted-foreground"
    >
      <AlertTriangle aria-hidden className="size-4 shrink-0" />
      <span>{label} couldn&apos;t be loaded. Reload to try again.</span>
    </div>
  )
}
