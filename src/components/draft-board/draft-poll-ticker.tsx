'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { pollActiveDraft } from '@/app/(admin)/leagues/[leagueId]/draft/actions'
import type { DraftSessionState } from '@/services/draft-sessions'

/**
 * The elevated-cadence poll driver (Wave 3b orchestration item 2, Nick's
 * Clarify decisions: client-driven trigger, 5-second interval). Renders
 * nothing — while the board is mounted AND the session is active, it invokes
 * the `pollActiveDraft` server action on an interval; the server re-checks
 * the TTL-aware flag before any Sleeper request, so this ticker is a trigger,
 * never an authority. Ticks are skipped while a previous one is in flight
 * (a slow response never stacks requests), the loop stands down the moment
 * the server reports the session inactive, and a transient action failure
 * just leaves the next tick to retry.
 *
 * Normal-cadence fallback needs no code here: with no live session, draft
 * sync happens only via the daily league-state cron chain. The live status
 * indicator and board-state merging belong to the client-side live sync
 * sub-section — this component deliberately only triggers server polls and
 * refreshes the router when new picks landed.
 */

/** Elevated cadence while a draft is live (Nick-signed, 2026-07-22). */
const POLL_INTERVAL_MS = 5_000

interface DraftPollTickerProps {
  session: DraftSessionState
}

export default function DraftPollTicker({ session }: DraftPollTickerProps) {
  const router = useRouter()
  const inFlight = useRef(false)
  const halted = useRef(false)

  useEffect(() => {
    if (!session.isDraftActive) return
    // A fresh session prop (new activation or re-render) re-arms the loop.
    halted.current = false

    const tick = async () => {
      if (inFlight.current || halted.current) return
      inFlight.current = true
      try {
        const result = await pollActiveDraft(session.leagueId)
        if (result.outcome === 'polled') {
          if (result.sync.status === 'success' && result.sync.picksWritten > 0) {
            router.refresh()
          }
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
    return () => clearInterval(id)
  }, [session.isDraftActive, session.activatedAt, session.leagueId, router])

  return null
}
