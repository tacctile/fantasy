interface SpectatorUnofficialChipProps {
  /** `is_final` from player_scores/matchups — final scores render nothing. */
  isFinal: boolean
}

/**
 * Muted "unofficial" marker for the spectator surface. Deliberately a
 * spectator-local component rather than an import of the admin dashboard's
 * chip: the share-link surface is a genuinely separate rendering path that
 * imports zero admin UI (MASTER_CONTEXT Access Model). The freshness rule it
 * serves is project-wide though — a non-final score is never silently
 * presented as settled, on either surface.
 */
export default function SpectatorUnofficialChip({
  isFinal,
}: SpectatorUnofficialChipProps) {
  if (isFinal) return null
  return (
    <span className="inline-flex h-4 shrink-0 items-center rounded-full bg-muted px-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
      unofficial
    </span>
  )
}
