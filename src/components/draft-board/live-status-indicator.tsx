'use client'

import { useEffect, useState } from 'react'

import type { DraftSessionState } from '@/services/draft-sessions'

import { formatSyncAge, isDegraded, type LivePollHealth } from './live-status'

interface LiveStatusIndicatorProps {
  session: DraftSessionState
  health: LivePollHealth
}

/**
 * Toolbar live status indicator (Wave 3b client-side live sync item 5).
 * Renders beside the "Draft live" label (Nick's placement, 2026-07-22):
 * polling source (Sleeper — the only live source in v1), last successful
 * poll time as a live-updating relative age, and connection health. All
 * Nick-signed rules: hidden entirely when no session is active (nothing is
 * polling, nothing to claim); "Paused — tab in background" while the ticker
 * is deliberately skipping hidden-tab ticks; degraded after 2 consecutive
 * failed ticks, muted-tier text only (teal stays reserved for the live dot;
 * no status colors), recovering instantly on the next success.
 */
export default function LiveStatusIndicator({
  session,
  health,
}: LiveStatusIndicatorProps) {
  const [tabHidden, setTabHidden] = useState(false)
  // Re-render clock for the relative age. Starts null so the server render
  // and hydration never disagree on a timestamp; the effect below arms it
  // only after a poll has actually succeeded (client-only state).
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    if (!session.isDraftActive) return
    const sync = () => setTabHidden(document.visibilityState === 'hidden')
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [session.isDraftActive])

  useEffect(() => {
    if (!session.isDraftActive || health.lastSuccessAt === null) return
    // No immediate setNow (lint: no setState-in-effect) — until the first
    // 1s tick, render falls back to lastSuccessAt itself, reading "0s ago",
    // which is truthful: lastSuccessAt only ever moves on a fresh success.
    const id = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(id)
  }, [session.isDraftActive, health.lastSuccessAt])

  if (!session.isDraftActive) return null

  const syncedAge =
    health.lastSuccessAt === null
      ? null
      : formatSyncAge((now ?? health.lastSuccessAt) - health.lastSuccessAt)

  if (tabHidden) {
    return (
      <span className="text-sm text-muted-foreground">
        Paused — tab in background
      </span>
    )
  }

  if (isDegraded(health)) {
    return (
      <span role="status" className="text-sm text-muted-foreground">
        Sleeper sync issue — retrying
        {syncedAge === null ? null : (
          <>
            {' · synced '}
            <span className="tabular-nums">{syncedAge}</span>
          </>
        )}
      </span>
    )
  }

  return (
    <span className="text-sm text-muted-foreground">
      {syncedAge === null ? (
        'Sleeper · syncing…'
      ) : (
        <>
          {'Sleeper · synced '}
          <span className="tabular-nums">{syncedAge}</span>
        </>
      )}
    </span>
  )
}
