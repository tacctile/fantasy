import { Link2Off } from 'lucide-react'

/**
 * Dead-link page for the spectator surface (Nick's Clarify): what a leaguemate
 * sees when a share link was regenerated, revoked, or mistyped. Reached via
 * `notFound()` in this segment, so it carries a real 404 status rather than a
 * friendly-looking 200.
 *
 * It names no league, no owner, and no team — an invalid token must not
 * confirm or deny what it used to open — and offers no login, signup, or auth
 * affordance of any kind, because viewers never have accounts (Access Model).
 * The only remedy is a human one: ask the owner for the new link.
 */
export default function SpectatorNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Link2Off aria-hidden className="size-8 text-muted-foreground" />
      <h1 className="text-lg font-semibold tracking-tight">
        This link isn&apos;t active
      </h1>
      <p className="text-sm text-muted-foreground">
        It may have been replaced with a new one, or the address was mistyped.
        Ask whoever shared it with you for the current link.
      </p>
    </main>
  )
}
