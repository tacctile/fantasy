'use client'

import { usePathname } from 'next/navigation'

import SpectatorUnavailable from '@/components/spectator/spectator-unavailable'

/**
 * Last-resort error boundary for the spectator segment. The page itself
 * already catches loader failures and renders the same view server-side with
 * no client JavaScript at all (the normal path); this boundary exists for what
 * a server catch can't reach — a throw during render or hydration — so a
 * leaguemate never lands on Next's default error page, which is the gap this
 * closes (STATE.yml known issue, 2026-07-31).
 *
 * Next requires an error boundary to be a Client Component, so this file is
 * the one client module on the spectator route. It deliberately does not use
 * `reset`: retry is a plain anchor back to the same share URL (Nick's Clarify)
 * — the surface carries zero buttons by design. Neither `error.message` nor
 * `error.digest` is rendered (Nick's Clarify; Access Model): a viewer can act
 * on neither, and internal error content never reaches a spectator response.
 */
export default function SpectatorError() {
  const pathname = usePathname()
  return <SpectatorUnavailable retryHref={pathname} />
}
