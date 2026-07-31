interface SpectatorSectionNoticeProps {
  /** What failed, lowercase, as it reads mid-sentence — "the standings",
   *  "this week's matchups". */
  label: string
}

/**
 * Inline notice for a spectator section whose query failed, so one bad section
 * degrades alone rather than blanking a leaguemate's whole view (2026-07-31).
 * A genuinely separate component from the admin surface's `SectionUnavailable`
 * — the spectator path imports zero admin UI (Access Model), and the copy
 * differs deliberately: a viewer has no sync to run and no logs to read, so it
 * says only that the section will come back, never why it broke.
 *
 * Distinct from the sections' empty states: "no standings for this league yet"
 * is honest data, this is an admission that the data couldn't be fetched.
 */
export default function SpectatorSectionNotice({
  label,
}: SpectatorSectionNoticeProps) {
  return (
    <div
      role="status"
      className="rounded-xl bg-card px-3 py-8 text-center text-sm text-muted-foreground"
    >
      Couldn&apos;t load {label} right now. Try again in a moment.
    </div>
  )
}
