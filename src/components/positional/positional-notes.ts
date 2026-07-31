import type {
  PositionalBreakdownData,
  PositionalBucket,
} from '@/services/positional'
import { UNMAPPED_BUCKET } from '@/services/positional'

/**
 * The Positional section's shared caveat lines and label conventions (Wave 5 —
 * Positional breakdowns).
 *
 * Written once here rather than inline in each chart so the single-team bars,
 * the league heatmap, and the detail table can never end up disclosing
 * different things about the same numbers — the same discipline `luck-notes.ts`
 * established, and it matters more here, because this section's central number
 * is INFERRED rather than observed.
 */

/** The reader-facing name of a bucket. Slot labels are shown as the league writes them. */
export function bucketLabel(bucket: PositionalBucket): string {
  if (bucket.key === UNMAPPED_BUCKET) return 'Unmapped'
  return bucket.key.replace(/_/g, ' ')
}

/** A compact header label — the heatmap's columns are narrow by construction. */
export function bucketShortLabel(bucket: PositionalBucket): string {
  if (bucket.key === UNMAPPED_BUCKET) return '??'
  if (bucket.kind === 'flex') {
    return bucket.key === 'SUPER_FLEX' ? 'SFLX' : bucket.key.replace(/_?FLEX/, 'FLX')
  }
  return bucket.key
}

/**
 * The week range this section counted, with the regular-season exclusion named
 * whenever it applied — deliberately the same wording shape Score Trends and
 * the Luck Tracker already use, so a reader who has seen one recognises this.
 */
export function positionalWeekNote(data: PositionalBreakdownData): string {
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
  return `${range} · ${scope}${provisional} · started players only`
}

/**
 * The small-sample caveat, or null once the sample is large enough. Same ~6-week
 * floor and the same flag-don't-suppress posture the rest of the wave applies.
 */
export function positionalConfidenceNote(
  data: PositionalBreakdownData
): string | null {
  if (!data.lowConfidence) return null
  return `Provisional read — ${data.weeksCounted} ${
    data.weeksCounted === 1 ? 'week' : 'weeks'
  } counted, under the ~6 weeks a per-position split needs to mean much.`
}

/**
 * The attribution disclosure — the most important line on the surface.
 *
 * `player_scores` records that a player started, never which slot he filled, so
 * flex attribution is reconstructed from the league's own slot layout. A reader
 * comparing this against their platform's lineup screen must know that before
 * they conclude the numbers are wrong, not after.
 */
export function positionalAttributionNote(
  data: PositionalBreakdownData
): string | null {
  if (!data.layoutResolved) {
    return "This league's roster layout hasn't synced, so every start is counted under the player's own position and no flex slots are shown."
  }
  if (data.flexAttributedStarts === 0) return null
  return `Flex slots are inferred, not recorded: the platform stores who started, not which slot they filled, so dedicated slots are filled first and the surplus counts as flex. ${data.flexAttributedStarts} ${
    data.flexAttributedStarts === 1 ? 'start' : 'starts'
  } were attributed this way.`
}

/**
 * The unmapped-player disclosure, or null when every start resolved. Item 5
 * requires unmapped players be surfaced explicitly rather than silently
 * dropped — this is that surfacing, paired with the Unmapped bucket itself.
 */
export function positionalUnmappedNote(
  data: PositionalBreakdownData
): string | null {
  if (data.unmappedStarts === 0) return null
  return `${data.unmappedPlayerCount} ${
    data.unmappedPlayerCount === 1 ? 'player' : 'players'
  } could not be matched to a position (${data.unmappedStarts} ${
    data.unmappedStarts === 1 ? 'start' : 'starts'
  }, ${data.unmappedPoints.toFixed(1)} points). They are counted under Unmapped and left out of positional ranks.`
}

/**
 * The overflow disclosure, or null when every start fitted a slot. A lineup
 * larger than the layout allows means the layout and the score rows disagree —
 * worth naming, since it changes how the flex figures should be read.
 */
export function positionalOverflowNote(
  data: PositionalBreakdownData
): string | null {
  if (data.overflowStarts === 0) return null
  return `${data.overflowStarts} ${
    data.overflowStarts === 1 ? 'start' : 'starts'
  } did not fit any starting slot in the synced layout and were counted under the player's own position.`
}

/** Every applicable disclosure, in the order a reader should meet them. */
export function positionalNotes(data: PositionalBreakdownData): string[] {
  return [
    positionalConfidenceNote(data),
    positionalAttributionNote(data),
    positionalUnmappedNote(data),
    positionalOverflowNote(data),
  ].filter((note): note is string => note !== null)
}
