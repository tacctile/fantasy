import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import SpectatorPlayerCard from '@/components/spectator/spectator-player-card'
import SpectatorPlayerDrawer from '@/components/spectator/spectator-player-drawer'
import SpectatorSectionNotice from '@/components/spectator/spectator-section-notice'
import SpectatorShell from '@/components/spectator/spectator-shell'
import SpectatorUnavailable from '@/components/spectator/spectator-unavailable'
import {
  loadSpectatorDashboard,
  loadSpectatorPlayerCard,
  type SpectatorDashboardResult,
  type SpectatorPlayerCardResult,
} from '@/services/spectator'

/**
 * The share link is unguessable, but a leaguemate could paste it anywhere —
 * keep it out of search results regardless (Nick's Clarify). Deliberately
 * static: a generateMetadata that named the league would cost a second token
 * resolution per request for a browser-tab string.
 */
export const metadata: Metadata = {
  title: 'League view',
  robots: { index: false, follow: false },
}

/** First value when Next hands back an array; undefined stays undefined. */
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/** Token resolution itself failing (as opposed to the token being wrong). */
const LOADER_FAILED = { ok: false, reason: 'load_failed' } as const

/**
 * Degrade a thrown loader failure to a typed result so the page can render the
 * static, zero-JS unavailable view itself instead of escalating to the client
 * error boundary (Nick's Clarify: the spectator surface ships no client JS on
 * its normal paths). The cause is logged server-side and never returned — a
 * viewer sees no internal error content (Access Model).
 */
async function settleLoad<T>(
  label: string,
  load: Promise<T>
): Promise<T | typeof LOADER_FAILED> {
  try {
    return await load
  } catch (error) {
    console.error(`[spectator] ${label} failed`, error)
    return LOADER_FAILED
  }
}

/**
 * Read-only spectator dashboard for one league's share link (Wave 4 Access
 * Model). Everything a viewer sees comes from `services/spectator.ts` through
 * the anon + `x-share-token` client — RLS is the wall, this route never
 * touches the owner server client, the service-role client, or any admin
 * component.
 *
 * No auth, no login prompt, no session: possession of the link is the access
 * control. An invalid, revoked, or malformed token resolves to this segment's
 * `not-found.tsx` — a friendly dead-link page on a real 404 (Nick's Clarify) —
 * never a partial render and never a hint about what league the token used to
 * open.
 *
 * Current week only, hard: `?week=` is deliberately not read (Nick's Clarify),
 * so the absent week-navigation control isn't merely hidden — the capability
 * isn't wired at all. `?player=` IS honored: it opens the lightweight player
 * drawer and makes a player view linkable.
 */
export default async function SpectatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ share_token: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const [{ share_token: shareToken }, query] = await Promise.all([
    params,
    searchParams,
  ])

  const result: SpectatorDashboardResult | typeof LOADER_FAILED =
    await settleLoad('dashboard', loadSpectatorDashboard(shareToken))
  // A bad/revoked token is a real 404 (not-found.tsx); a genuine fault is a
  // different message on a live link — the two must never be conflated.
  if (!result.ok && result.reason === 'invalid_token') notFound()
  if (!result.ok) return <SpectatorUnavailable retryHref={`/share/${shareToken}`} />

  const playerId = firstParam(query.player)
  const playerResult: SpectatorPlayerCardResult | typeof LOADER_FAILED | null =
    playerId === undefined
      ? null
      : await settleLoad(
          'playerCard',
          loadSpectatorPlayerCard(shareToken, playerId)
        )
  const closeHref = `/share/${shareToken}`

  return (
    <SpectatorShell
      data={result.data}
      playerSlot={
        playerResult === null ? undefined : playerResult.ok ? (
          <SpectatorPlayerDrawer
            closeHref={closeHref}
            label={
              playerResult.data.player.fullName ??
              playerResult.data.player.sleeperPlayerId
            }
          >
            <SpectatorPlayerCard data={playerResult.data} />
          </SpectatorPlayerDrawer>
        ) : playerResult.reason === 'player_not_found' ? (
          <SpectatorPlayerDrawer closeHref={closeHref} label="Player not found">
            <p className="py-6 text-center text-sm text-muted-foreground">
              No player matches this link.
            </p>
          </SpectatorPlayerDrawer>
        ) : (
          // The dashboard itself loaded, so this is this one card failing —
          // the drawer says so and the page behind it stays intact.
          <SpectatorPlayerDrawer closeHref={closeHref} label="Player unavailable">
            <SpectatorSectionNotice label="this player&apos;s details" />
          </SpectatorPlayerDrawer>
        )
      }
    />
  )
}
