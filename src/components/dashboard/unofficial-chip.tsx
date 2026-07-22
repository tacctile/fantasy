interface UnofficialChipProps {
  /** `is_final` from player_scores/matchups — final scores render nothing. */
  isFinal: boolean
}

/**
 * Muted "unofficial" marker for any non-final score surface (freshness
 * surfacing, Nick-signed 2026-07-22: muted tier, never a status color —
 * until finality promotion ships, most in-season rows read non-final, and
 * painting them all in an urgency color would invert the color-equals-
 * actionable rule). Same chip anatomy as the unknown-injury-tag treatment.
 */
export default function UnofficialChip({ isFinal }: UnofficialChipProps) {
  if (isFinal) return null
  return (
    <span className="inline-flex h-4 shrink-0 items-center rounded-full bg-muted px-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
      unofficial
    </span>
  )
}
