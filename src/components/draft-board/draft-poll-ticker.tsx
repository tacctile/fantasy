'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { pollActiveDraft } from '@/app/(admin)/leagues/[leagueId]/draft/actions'
import type { RecordedPick } from '@/services/draft-picks'
import type { DraftSessionState } from '@/services/draft-sessions'

/**
 * The elevated-cadence poll driver (Wave 3b orchestration item 2 + client-side
 * live sync item 1; Nick's Clarify decisions: client-driven trigger, 5-second
 * interval, interval re-fetch over Realtime). Renders nothing — while the
 * board is mounted, the tab is visible, AND the session is active, it invokes
 * the `pollActiveDraft` server action on an interval; the server re-checks
 * the TTL-aware flag before any Sleeper request, so this ticker is a trigger,
 * never an authority. Ticks are skipped while a previous one is in flight
 * (a slow response never stacks requests) and while the tab is hidden
 * (Nick-signed 2026-07-22: no background requests; an immediate tick fires
 * the moment the tab becomes visible again so the first glance is never
 * stale). The loop stands down the moment the server reports the session
 * inactive, and a transient action failure just leaves the next tick to retry.
 *
 * Each executed poll's full draft_state snapshot is handed to `onPicks` — the
 * board's merge layer consumes it (client-side live sync item 2). That merge
 * replaced the previous refresh-on-picks behavior (Nick-signed):
 * `router.refresh()` remains only for stand-down outcomes, where the
 * server-rendered session state must take over.
 *
 * Normal-cadence fallback needs no code here: with no live session, draft
 * sync happens only via the daily league-state cron chain.
 */

/** Elevated cadence while a draft is live (Nick-signed, 2026-07-22). */
const POLL_INTERVAL_MS = 5_000

interface DraftPollTickerProps {
  session: DraftSessionState
  /** Receives each executed poll's draft_state snapshot. Must be referentially
   *  stable (useCallback) — it participates in the effect dependency list. */
  onPicks: (picks: RecordedPick[]) => void
}

export default function DraftPollTicker({ session, onPicks }: DraftPollTickerProps) {
  const router = useRouter()
  const inFlight = useRef(false)
  const halted = useRef(false)

  useEffect(() => {
    if (!session.isDraftActive) return
    // A fresh session prop (new activation or re-render) re-arms the loop.
    halted.current = false

    const tick = async () => {
      if (inFlight.current || halted.current) return
      // Hidden tab: skip the request entirely — the visibilitychange listener
      // below fires an immediate catch-up tick on return.
      if (document.visibilityState === 'hidden') return
      inFlight.current = true
      try {
        const result = await pollActiveDraft(session.leagueId)
        if (result.outcome === 'polled') {
          onPicks(result.picks)
        } else {
          // inactive / unauthorized / league_not_found — stand down and let
          // the server-rendered session state take over on refresh.
          halted.current = true
          router.refresh()
        }
      } catch {
        // Transient network/action failure — the next tick retries.
      } finally {
        inFlight.current = false
      }
    }

    const id = setInterval(() => {
      void tick()
    }, POLL_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void tick()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [session.isDraftActive, session.activatedAt, session.leagueId, router, onPicks])

  return null
}
