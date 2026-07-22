import type { DraftBoardLeagueContext } from '@/services/draft-board'

import CommandChip from './command-chip'

export type AdpNoticeKind =
  /** Nothing ingested for the source at all (no snapshot season exists). */
  | 'no_adp_ingested'
  /** League's derived_config is missing/malformed — no format to match. */
  | 'format_unresolved'
  /** A snapshot exists, but the league's resolved format has zero rows. */
  | 'format_empty'

type AdpNoticeContext = Pick<
  DraftBoardLeagueContext,
  'scoringFormat' | 'adpSource' | 'adpSeasonYear' | 'adpIngestedAt'
>

/**
 * Classify the board's ADP-absence state, or null when ADP is present. Pure —
 * testable directly. Precedence is the healing order, not severity: a missing
 * snapshot surfaces first (sync:adp fixes it regardless of config state), an
 * unresolvable format second (re-sync league config), and a format-specific
 * hole last — per the format-leakage rule, a format with no rows is an
 * explicit empty state, never another format's numbers.
 */
export function deriveAdpNoticeKind(
  context: AdpNoticeContext
): AdpNoticeKind | null {
  if (context.adpSeasonYear === null) return 'no_adp_ingested'
  if (context.scoringFormat === null) return 'format_unresolved'
  if (context.adpIngestedAt === null) return 'format_empty'
  return null
}

/** The Nick-signed next-action line: on-demand command + when it self-heals. */
function SyncAdpAction() {
  return (
    <>
      Run <CommandChip command="npm run sync:adp" /> — or it lands with the
      daily sync at 10:00 UTC.
    </>
  )
}

/**
 * Inline notice above the board when ADP is absent (Nick-signed: banner over
 * the still-rendered rostered list, never hiding real data). Warning tier —
 * actionable information, not an error. Copy names the exact missing thing
 * (source, season, format) with a clear next action per variant.
 */
export default function AdpNotice({
  context,
}: {
  context: DraftBoardLeagueContext
}) {
  const kind = deriveAdpNoticeKind(context)
  if (kind === null) return null

  return (
    <div role="status" className="mb-3 rounded-xl bg-card px-4 py-3">
      {kind === 'no_adp_ingested' && (
        <>
          <p className="text-sm font-semibold text-warning">
            No ADP ingested yet
          </p>
          <p className="pt-0.5 text-xs text-muted-foreground">
            Source “{context.adpSource}” has no snapshot, so players list
            without draft-market order. <SyncAdpAction />
          </p>
        </>
      )}
      {kind === 'format_unresolved' && (
        <>
          <p className="text-sm font-semibold text-warning">
            League scoring format unresolved
          </p>
          <p className="pt-0.5 text-xs text-muted-foreground">
            This league’s config is missing or malformed, so no ADP format can
            be matched. Re-sync it with{' '}
            <CommandChip command="npm run sync:league" />.
          </p>
        </>
      )}
      {kind === 'format_empty' && (
        <>
          <p className="text-sm font-semibold text-warning">
            No{' '}
            <span className="font-mono">{context.scoringFormat}</span> ADP in
            the <span className="tabular-nums">{context.adpSeasonYear}</span>{' '}
            snapshot
          </p>
          <p className="pt-0.5 text-xs text-muted-foreground">
            This league’s format carries no rows — another format’s numbers are
            never substituted. <SyncAdpAction />
          </p>
        </>
      )}
    </div>
  )
}
