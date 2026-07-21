---
title: "ESPN Historical Season Access (leagueHistory)"
type: domain-knowledge
category: espn-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - undocumented-endpoint
  - rest-api
  - league-settings
related:
  - espn-api/base-url-and-versioning
  - espn-api/roster-response-structure
  - espn-api/matchup-response-structure
---

## Summary

Historical (prior-season) league data is retrieved through a structurally distinct `leagueHistory/{leagueId}?seasonId={year}` endpoint rather than by simply changing the season in the current-season URL. The single most important and most consistently corroborated pitfall: this endpoint returns a JSON **array** even when a single season is requested, while the current-season endpoint returns a plain object — code written against one shape will fail against the other, and the correct season should always be selected from the array by matching `seasonId`, not by assuming array position.

---

## Core Knowledge

### Endpoint Shape and the Array Pitfall

The historical endpoint (`.../leagueHistory/{leagueId}?seasonId={year}`) accepts the same `view` query parameters as the current-season endpoint, but wraps its result in an array of league-season snapshot objects rather than returning one object directly. This is true even for a single requested `seasonId`. The correct season object should be selected by matching its `seasonId` field, not assumed to be array index 0 — this protects against unexpected multi-season responses if a caller ever requests a range of seasons, and against any future change in array ordering. A parser written only against the current-season object shape will fail silently or throw against this endpoint, and this array-vs-object mismatch is the most commonly reported implementation bug for historical access across all sources.

### Reduced and Season-Dependent View Support

Not every `view` supported on the current-season endpoint behaves identically, or is supported at all, on `leagueHistory`. League settings, teams, schedule, and standings-oriented views are generally well supported historically. Player-pool-oriented views, and in particular `kona_player_info`, are reported as unsupported or unreliable on the historical endpoint — historical player-pool state (ownership, ADP, live filtering) should not be assumed retrievable through this endpoint at all. Draft detail (`mDraftDetail`) support for historical seasons is inconsistent — some seasons return complete pick records, others return an empty `picks` array even where a draft is known to have occurred, with no field in the response distinguishing "no draft occurred" from "draft data was not retained."

### Rosters Reflect End-of-Season State, Not Week-by-Week History

Historical roster views return the roster as it stood at the end of that season, not a week-by-week snapshot. There is no mechanism in this endpoint to reconstruct what a team's lineup looked like in a specific past week — that would require combining draft data, transaction/waiver logs, and trade history, none of which are reliably or completely available historically through this API. Any feature requiring historical week-by-week lineup reconstruction should treat this as a hard limitation of the data source, not an implementation gap to be worked around.

### Team and Owner Identity Is Not Stable Across Seasons

A league's persistent `leagueId` does not imply stable team identity within it. Team IDs, team names, owners, and even franchise count can change year to year — including in ways not visible from the current season's roster of teams. A historical fact keyed only by team ID, without season, risks silently misattributing a prior season's results to the wrong current-day franchise or owner. Cross-season analysis needs team identity resolved per-season from that season's own `teams`/member data, with any longer-run "same franchise across years" mapping built and maintained separately by the platform rather than assumed from ESPN's data.

### Score Finalization and the winner Field

A matchup's `winner` field can remain in an undecided or provisional state even for a season that has otherwise concluded, rather than being reliably updated to a final value. Winner determination for historical matchups should be derived by comparing each side's point totals directly rather than trusting the `winner` field alone, consistent with the general score-volatility and finalization caveats already documented for matchup data.

### Historical Data Availability Is Degrading, Not Fixed

Consistent with the general historical-availability caveat already established for this API, older seasons — particularly those predating ESPN's last major platform migration — show inconsistent and declining data completeness: some very old leagues retain full draft and schedule detail, others return empty or thin structures for the same category of data with no apparent pattern distinguishing which leagues were affected. No specific cutoff year or purge date should be treated as authoritative; availability should be treated as unreliable and season-by-season verified rather than assumed from a fixed boundary.

---

## Key Decisions

- **Decision:** The platform's ESPN historical-data client will always treat a `leagueHistory` response as an array and will select the target season by matching `seasonId` on an element, never by assuming a fixed array position or object root.
  **Reasoning:** This is the single most consistently corroborated implementation pitfall across all sources for this endpoint — a parser written against the current-season object shape fails against this endpoint, and matching by `seasonId` rather than array position is robust against any future change in how ESPN orders or structures multi-season responses.
  **Rejected alternative:** Assuming the first array element is always the correct season was rejected — while true for the common case of a single requested season, it is not a documented guarantee, and matching by `seasonId` costs nothing extra while eliminating an entire class of silent misattribution bugs.

- **Decision:** The platform will not attempt to reconstruct historical week-by-week lineups from `leagueHistory` data and will document this explicitly as a data-source limitation rather than a build gap, consistent with `MASTER_CONTEXT.md`'s exclusion of historical/season-over-season views from v1 scope.
  **Reasoning:** Historical rosters reflect only end-of-season state, and the transaction/waiver/trade data needed to reconstruct intermediate states is not reliably or completely available through this API — building a feature that promises this would either be silently wrong or require an engineering investment disproportionate to v1 scope, which already excludes historical views entirely.
  **Rejected alternative:** Attempting a best-effort reconstruction from whatever transaction data is available was rejected for v1 — partial, unreliable historical reconstruction risks presenting confidently wrong data to Nick, and this entire category is already out of scope per `MASTER_CONTEXT.md`.

---

## Open Questions

- [ ] Whether `kona_player_info` is entirely unsupported on `leagueHistory` or merely unreliable/inconsistently populated was not resolved to high confidence — needs direct verification against a specific historical league before assuming either behavior.
- [ ] No specific cutoff year or purge date for degrading historical availability is established with confidence — panel sources gave inconsistent specific dates, consistent with the same unresolved question already logged on `espn-api/base-url-and-versioning`. Treat per-season availability as needing direct verification rather than assumed from any claimed boundary.
- [ ] Whether draft detail's inconsistent historical completeness (some seasons empty despite a known draft having occurred) correlates with league age, a specific platform migration, or is effectively unpredictable per-league is unresolved.
