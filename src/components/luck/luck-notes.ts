import type { LuckData } from '@/services/luck'

/**
 * The Luck Tracker's shared caveat lines (Wave 5 — Lucky/unlucky tracker).
 *
 * Written once here rather than inline in each chart, so the ranked view, the
 * drill-down, and the spectator summary can never end up disclosing different
 * things about the same numbers — the disclosures are the load-bearing part of
 * this section, not decoration.
 */

/**
 * The week range the tracker actually counted, with the regular-season
 * exclusion named whenever it applied — the same rule and wording shape
 * `weekRangeNote` uses on the Score Trends surface, so a reader who has seen
 * one recognises the other.
 */
export function luckWeekNote(data: LuckData): string {
  if (data.weeks.length === 0) return 'No weeks scored yet'
  const range =
    data.weeks.length === 1
      ? `Week ${data.weeks[0]}`
      : `Weeks ${data.weeks[0]}–${data.weeks[data.weeks.length - 1]}`
  const scope =
    data.playoffWeekStart === null
      ? 'all scored weeks'
      : `regular season (playoffs start week ${data.playoffWeekStart})`
  const provisional =
    data.nonFinalWeeksCounted > 0
      ? ` · ${data.nonFinalWeeksCounted} unofficial`
      : ''
  return `${range} · ${scope}${provisional}`
}

/**
 * The small-sample caveat, or null once the sample is large enough.
 *
 * Not optional and not softened: the luck wiki page
 * (in-season-management/points-for-against-luck-analysis) converges on treating
 * roughly the first five to six weeks as an unreliable luck signal, and decides
 * the platform must flag such a reading rather than present it at full weight.
 * Nick's Clarify (2026-07-31) chose flagging over suppressing, matching how
 * power rankings and the score-spread band already behave.
 */
export function luckConfidenceNote(data: LuckData): string | null {
  if (!data.lowConfidence) return null
  return `Provisional read — ${data.weeksCounted} ${
    data.weeksCounted === 1 ? 'week' : 'weeks'
  } counted, under the ~6 weeks a luck signal needs to mean much.`
}

/**
 * The bye-week disclosure, or null when no team has one.
 *
 * Nick's Clarify (2026-07-31): a week a team scored in but had no opponent for
 * still feeds the all-play expectation (the score is a real observation) while
 * recording no actual result. That makes the expectation's denominator larger
 * than the record's for those teams, which is a real asymmetry — the answer
 * required it be "stated plainly", so it is stated here rather than absorbed
 * silently into the differential.
 */
export function luckRatingGapNote(data: LuckData): string | null {
  if (!data.hasRatingGap) return null
  const affected = data.teams.filter((team) => team.hasRatingGap).length
  return `${affected} ${
    affected === 1 ? 'team has a week' : 'teams have weeks'
  } they scored in without an opponent (bye or unpaired). Those weeks count toward expected wins but not toward the record.`
}

/**
 * The standings cross-check disclosure, or null when the two agree.
 *
 * The record here is recomputed from regular-season matchups (Nick's Clarify)
 * rather than read from the `standings` snapshot, so the two can legitimately
 * differ — a snapshot including playoff results is the ordinary case. Surfacing
 * the disagreement is what keeps that a documented difference rather than an
 * apparent bug on whichever page the reader looks at second.
 */
export function luckStandingsNote(data: LuckData): string | null {
  if (!data.hasStandingsDisagreement) return null
  const affected = data.teams.filter(
    (team) => team.disagreesWithStandings
  ).length
  return `${affected} ${
    affected === 1 ? "team's" : "teams'"
  } regular-season record here differs from the standings snapshot, which also counts weeks this view excludes.`
}
