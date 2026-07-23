'use client'

import Link from 'next/link'

import { Button, buttonVariants } from '@/components/ui/button'

/**
 * Route-segment error boundary for the league surface — the command-center
 * home and the standings/matchups dashboard beneath it (the draft board has
 * its own boundary). Catches real data-fetch/render failures (data GAPS never
 * land here — the service layer degrades those to honest empty states and
 * per-surface notices). Copy is generic by design: raw error details never
 * render (Access Model data-exposure posture — same pattern as the draft
 * board's boundary); the digest is Next's log-correlation hash, not error
 * content. "Back to leagues" escapes a persistently failing league so one
 * broken league never dead-ends navigation away from healthy ones.
 */
export default function LeagueDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div
        role="alert"
        className="flex w-full max-w-md flex-col items-center gap-1 rounded-xl bg-card px-6 py-8 text-center"
      >
        <p className="text-sm font-semibold">
          This league couldn&apos;t load
        </p>
        <p className="text-xs text-muted-foreground">
          Something failed while loading this league&apos;s data. It may be
          temporary — other leagues are unaffected.
        </p>
        {error.digest !== undefined && (
          <p className="text-xs text-muted-foreground/70">
            Ref <span className="font-mono">{error.digest}</span>
          </p>
        )}
        <div className="flex items-center gap-2 pt-3">
          <Button size="sm" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/"
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          >
            Back to leagues
          </Link>
        </div>
      </div>
    </div>
  )
}
