/**
 * Sleeper NFL calendar state (Wave 2 cron sub-section): fetches `/state/nfl`
 * and resolves the one question the scheduled league sync needs answered —
 * which week's matchups to pull, if any.
 *
 * Per wiki/topics/sleeper-api/nfl-state-endpoint.md: the current week is
 * never derived from calendar date arithmetic, `week` is only meaningful for
 * matchup/scoring retrieval when `season_type` is `regular` (during `pre` it
 * counts preseason weeks, during `post` it runs past 18 into the NFL
 * postseason — every fantasy league's season is over by then — and the
 * undocumented `off` value is treated as a real fourth state), and
 * `display_week` is a UI-only value never used as a data key. Each scheduled
 * run fetches the state fresh, which sits well inside the page's
 * minutes-order caching guidance.
 */
import { sleeperGet } from './client'
import type { SleeperNflState } from './types'

/** Fetch the current NFL calendar state. Small unauthenticated payload. */
export async function getNflState(): Promise<SleeperNflState> {
  return sleeperGet<SleeperNflState>('/state/nfl')
}

/**
 * The week the scheduled league sync should pull matchups for, or null when
 * no scoreable fantasy week exists (`pre`/`post`/`off`, or a malformed
 * response). Bounds-checked to the 1–18 regular-season range defensively —
 * the endpoint is unversioned and has changed behavior across seasons.
 */
export function resolveMatchupSyncWeek(state: SleeperNflState): number | null {
  if (state.season_type !== 'regular') return null
  const week = state.week
  if (typeof week !== 'number' || !Number.isInteger(week)) return null
  if (week < 1 || week > 18) return null
  return week
}
