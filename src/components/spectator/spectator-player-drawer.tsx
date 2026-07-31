import { X } from 'lucide-react'

interface SpectatorPlayerDrawerProps {
  /** Where closing navigates — the share URL without the `player` param. */
  closeHref: string
  /** Accessible name for the dialog (player name, or a not-found label). */
  label: string
  children: React.ReactNode
}

/**
 * URL-driven bottom drawer for the spectator player view (mobile-first: it
 * rises from the bottom edge where a thumb is, rather than the admin sheet's
 * right-edge panel). Opened by `?player=<id>` on the share URL, so the browser
 * back button closes it and a leaguemate can paste a player link directly.
 *
 * Dismissal is plain anchors — backdrop and close button — so the whole
 * spectator surface ships with no client-side JS. Tradeoff, disclosed and
 * inherited from the admin sheet: no Escape-key close until something on this
 * surface genuinely needs a client dialog primitive.
 */
export default function SpectatorPlayerDrawer({
  closeHref,
  label,
  children,
}: SpectatorPlayerDrawerProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex flex-col justify-end"
    >
      <a
        href={closeHref}
        aria-label="Close player view"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <aside className="relative max-h-[85vh] overflow-y-auto rounded-t-2xl border-t bg-popover p-4 pb-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-2 flex justify-end">
          <a
            href={closeHref}
            aria-label="Close player view"
            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </a>
        </div>
        {children}
      </aside>
    </div>
  )
}
