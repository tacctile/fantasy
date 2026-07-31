import { CloudOff } from 'lucide-react'

interface SpectatorUnavailableProps {
  /** Where "Try again" points — the share URL the viewer is already on.
   *  Omitted by the route error boundary, which has no params to build one. */
  retryHref?: string
}

/**
 * Whole-page failure view for the spectator surface: what a leaguemate sees
 * when the league's data genuinely can't be fetched (a database fault, not a
 * bad token — a bad token is `not-found.tsx`, and the two must stay visibly
 * different so a working link is never mistaken for a dead one).
 *
 * Retry is a plain anchor, not a reset button (Nick's Clarify, 2026-07-31):
 * the spectator surface carries zero interactive controls by design and ships
 * no client JavaScript, and a link to the same URL is a full, honest retry.
 *
 * Shows no error message, no digest/ref, and no league identity — a viewer
 * can't act on any of it (Nick's Clarify), and internal error content never
 * reaches a rendered response on any surface (Access Model). No login, signup,
 * or auth affordance: viewers never have accounts.
 */
export default function SpectatorUnavailable({
  retryHref,
}: SpectatorUnavailableProps) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <CloudOff aria-hidden className="size-8 text-muted-foreground" />
      <h1 className="text-lg font-semibold tracking-tight">
        This league view isn&apos;t loading
      </h1>
      <p className="text-sm text-muted-foreground">
        The link is fine — the data just isn&apos;t coming through right now.
        Give it a moment and try again.
      </p>
      {retryHref !== undefined && (
        <a
          href={retryHref}
          className="text-sm font-medium text-primary underline underline-offset-4"
        >
          Try again
        </a>
      )}
    </main>
  )
}
