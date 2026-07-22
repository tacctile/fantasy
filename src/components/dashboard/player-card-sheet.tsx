import { X } from 'lucide-react'
import Link from 'next/link'

interface PlayerCardSheetProps {
  /** Where closing navigates — the page URL without the `player` param, so
   *  the selected week survives open/close round-trips. */
  closeHref: string
  /** Accessible name for the dialog (player name, or a not-found label). */
  label: string
  children: React.ReactNode
}

/**
 * URL-driven side sheet for the dashboard's player detail panel (Nick-signed
 * 2026-07-22): the page opens it when `?player=` is present, so a player card
 * is linkable and the browser back button closes it. Server-rendered with
 * Link-based dismissal (backdrop + close button) — no client JS, same posture
 * as the week selector and the bench collapsible. Tradeoff, disclosed: no
 * Escape-key close until a fold that wants a client dialog primitive.
 */
export default function PlayerCardSheet({
  closeHref,
  label,
  children,
}: PlayerCardSheetProps) {
  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50">
      <Link
        href={closeHref}
        aria-label="Close player card"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto border-l bg-background p-4 shadow-lg">
        <div className="mb-2 flex justify-end">
          <Link
            href={closeHref}
            aria-label="Close player card"
            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </Link>
        </div>
        {children}
      </aside>
    </div>
  )
}
