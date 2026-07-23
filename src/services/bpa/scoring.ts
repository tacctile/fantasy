/**
 * Projection scoring (Wave 3b BPA): applies a league's actual scoring weights
 * to a `player_projections` component-stat object, producing league-specific
 * projected fantasy points.
 *
 * THE single home of projection-scoring application (STATE.yml
 * centralization mandate): every BPA consumer — replacement level, base
 * value/VORP, the recommendations query — scores projections through here;
 * no per-consumer re-derivation, ever.
 *
 * Mechanism per wiki/topics/sleeper-api/league-endpoint.md: a league's
 * `scoring_settings` is a flat stat-key→point-value map sharing the
 * projection stats' key namespace, so points = Σ weight × stat over the
 * intersecting keys. A stat absent from the projection contributes zero at
 * calculation time only (the scoring-math equivalence) — the raw stored map
 * keeps the absent-vs-explicit-zero distinction intact. DST projections
 * score through the same mechanism via the league's own `def_*`/`st_*` keys
 * (league-endpoint Key Decision — never a universal DST formula).
 *
 * Canon guard (Nick's 2026-07-22 decision of record, MANUAL_SETUP Wave 3b;
 * player_scores canon in STATE.yml): preset `pts_*` format buckets are never
 * used as league values, and ADP is never read from
 * `player_projections.stats` — both key families are excluded structurally
 * at weight-parse time rather than left to caller discipline. This scores
 * PROJECTED value only; actual `player_scores` remain ingested
 * platform-scored, never computed.
 */

export type ScoringWeights = Record<string, number>

/** Key families that must never act as scoring weights or stat inputs:
 *  `adp_*` (market data — read from adp_rankings only) and `pts_*` (vendor
 *  preset format buckets — never league values). */
const EXCLUDED_KEY_PATTERN = /^(adp_|pts_)/

/**
 * Parse a `league_config.scoring_settings_raw` payload into usable weights.
 * Shape-tolerant, never throws: anything other than a plain object returns
 * null (caller degrades honestly); non-numeric values are dropped per the
 * open-map posture (unrecognized shapes tolerated, never guessed at).
 */
export function parseScoringWeights(raw: unknown): ScoringWeights | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const weights: ScoringWeights = {}
  for (const [key, value] of Object.entries(raw)) {
    if (EXCLUDED_KEY_PATTERN.test(key)) continue
    if (typeof value === 'number' && Number.isFinite(value)) {
      weights[key] = value
    }
  }
  return weights
}

/**
 * Score one projection stats object with a league's parsed weights.
 * Returns null when `stats` is not a plain object (an unscoreable row —
 * callers exclude it rather than inventing a zero). Absent or non-numeric
 * stat values contribute zero, per the league-endpoint calc-time rule.
 */
export function scoreProjectionStats(
  stats: unknown,
  weights: ScoringWeights
): number | null {
  if (typeof stats !== 'object' || stats === null || Array.isArray(stats)) return null
  const record = stats as Record<string, unknown>
  let points = 0
  for (const [key, weight] of Object.entries(weights)) {
    const stat = record[key]
    if (typeof stat === 'number' && Number.isFinite(stat)) {
      points += weight * stat
    }
  }
  return points
}
