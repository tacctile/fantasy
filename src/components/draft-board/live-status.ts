import type { DraftPollTickReport } from './draft-poll-ticker'

/**
 * Pure state layer for the toolbar live status indicator (Wave 3b client-side
 * live sync item 5). Mirrors the live-picks.ts pattern: the shell owns the
 * health state and folds each executed tick's report into it here; the
 * indicator component only renders the result. Polling authority stays with
 * the server action — this is display state, never a poll driver.
 */

/** Aggregated poll health the shell owns and the indicator renders. */
export interface LivePollHealth {
  /** Client timestamp (ms) of the last successful executed poll, or null if
   *  none has landed since the session (re)armed. */
  lastSuccessAt: number | null
  /** Failed executed ticks since the last success. */
  consecutiveFailures: number
}

export const INITIAL_POLL_HEALTH: LivePollHealth = {
  lastSuccessAt: null,
  consecutiveFailures: 0,
}

/** One transient blip self-heals silently; two misses (~10s stale at the 5s
 *  cadence) surface as degraded (Nick-signed, 2026-07-22). */
export const DEGRADED_AFTER_CONSECUTIVE_FAILURES = 2

export function applyTickReport(
  health: LivePollHealth,
  report: DraftPollTickReport
): LivePollHealth {
  if (report.outcome === 'success') {
    return { lastSuccessAt: report.at, consecutiveFailures: 0 }
  }
  return {
    lastSuccessAt: health.lastSuccessAt,
    consecutiveFailures: health.consecutiveFailures + 1,
  }
}

export function isDegraded(health: LivePollHealth): boolean {
  return health.consecutiveFailures >= DEGRADED_AFTER_CONSECUTIVE_FAILURES
}

/** Relative sync age: 1s granularity under a minute, then coarser units
 *  (Nick-signed relative-live-updating format, 2026-07-22). */
export function formatSyncAge(elapsedMs: number): string {
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}
