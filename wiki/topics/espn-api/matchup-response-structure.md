---
title: "ESPN Matchup Response Structure (mMatchup / mMatchupScore)"
type: domain-knowledge
category: espn-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - roster-structure
  - league-settings
  - undocumented-endpoint
related:
  - espn-api/view-parameter-reference
  - espn-api/roster-response-structure
  - espn-api/base-url-and-versioning
---

## Summary

ESPN's matchup data is exposed as a `schedule` array where each entry represents one fantasy contest, with `home`/`away` sides carrying team IDs and point totals. The single most important structural fact is the distinction between `scoringPeriodId` (an NFL-week-aligned stat-accumulation interval) and `matchupPeriodId` (a fantasy contest interval) — they are numerically equal during a standard single-week regular season, but diverge during multi-week playoff formats, where one `matchupPeriodId` spans multiple `scoringPeriodId`s and naively treating them as interchangeable causes either double-counting or undercounting of playoff matchup scores.

---

## Core Knowledge

### Schedule Response Shape

The `schedule` array (populated by `mMatchup` and/or `mMatchupScore`) contains one entry per matchup, generally including: `id`, `matchupPeriodId`, `home` and `away` side objects, and a `winner` field. Each side object commonly carries `teamId`, `totalPoints`, and — depending on view and game state — live and projected live point totals (`totalPointsLive`, `totalProjectedPointsLive`). `mMatchup` tends to include richer per-player/roster detail within the matchup context; `mMatchupScore` tends toward lighter score-summary totals. The exact boundary between what each view populates is not cleanly or consistently documented and has reportedly changed across ESPN's history — treat this split as directional guidance, not a strict contract.

### scoringPeriodId vs. matchupPeriodId — The Core Distinction

**`scoringPeriodId`** identifies the NFL statistical scoring interval — in standard season-long fantasy football, this aligns with an NFL week (1 through 18) and is the unit player stats and individual weekly scoring are keyed to.

**`matchupPeriodId`** identifies the fantasy contest interval — the unit a head-to-head matchup and its win/loss outcome are keyed to.

In a standard single-week-per-matchup regular season, these are equal: `matchupPeriodId = scoringPeriodId`. This equality is common but is not a guarantee or a definitional identity — it holds only because most regular-season formats happen to use one scoring period per matchup period.

**They diverge in multi-week matchup formats**, most commonly multi-week playoff rounds (e.g., a two-week championship). In that case, a single `matchupPeriodId` groups multiple `scoringPeriodId`s, and the matchup's final score is the sum of team points across all constituent scoring periods, not the score from any single one. The authoritative mapping between matchup periods and their constituent scoring periods lives in league schedule settings (`mSettings.scheduleSettings`) — this relationship should be read from settings data per league, not assumed from period numbers alone, since exact structure depends on league configuration (playoff matchup length, regular-season matchup length).

### The Multi-Week Summation Pitfall

The most consistently reported failure pattern for this subject: code that assumes `matchupPeriodId` and `scoringPeriodId` are always interchangeable will misbehave specifically during multi-week playoff rounds — either pulling only one constituent week's score and treating it as the full matchup result (undercounting), or, if a returned total field already represents the cumulative matchup sum, re-summing it against individually pulled weekly figures (double-counting). Before aggregating any matchup total across scoring periods, it must first be established whether a given points field already represents a cumulative sum or a single-period value.

### Player Stat Records and Reconciliation

Player-level stat records nested in matchup/roster data are distinguished by `scoringPeriodId`, `statSourceId` (actual vs. projected), and `statSplitTypeId` (weekly vs. season split) — the same disambiguation requirement documented on `espn-api/roster-response-structure` applies here. Summing individual starter point totals to reconstruct a team's matchup score will not always exactly equal the official `totalPoints` field returned by ESPN — discrepancies can arise from commissioner manual adjustments, timing of stat corrections, or precision/rounding differences. The official schedule-side total should be treated as authoritative for standings and win/loss determination; an independently computed player-level sum is useful as an audit/reconciliation figure, not a replacement.

### Score Volatility: Live vs. Final

Point totals are not static once a scoring period begins. Live totals (`totalPointsLive` and similar fields) update during active NFL games and can differ from the eventual final total due to stat corrections, which have been reported to continue for a period after games conclude (commonly cited as through the following Thursday — consistent with prior Sleeper-side findings on stat-correction timing, though ESPN's own correction window is not separately confirmed to the same degree). A `winner` field can remain in an undecided or provisional state for a period after games finish. Code that needs a final, reconciled score for historical analysis should not treat any score pulled during or immediately after an active scoring period as final without a later re-fetch.

### Bye Weeks and Missing Sides

In leagues with an odd number of teams, or during certain playoff bracket structures (byes, placeholder future-round matchups), a schedule entry can have a missing or null `away` (or, less commonly, `home`) side rather than a populated opposing team. Parsers that unconditionally access nested fields on both sides without checking for their existence will fail on these entries. Future/unplayed matchup entries can also appear in the schedule array with zero or placeholder point totals — these should not be included in historical performance analysis without checking game/period status first.

---

## Key Decisions

- **Decision:** The platform will store `scoringPeriodId` and `matchupPeriodId` as two distinct fields on every matchup and score record, and will resolve their relationship per league from that league's schedule settings rather than assuming numeric equality.
  **Reasoning:** The two values are only coincidentally equal in standard-format regular seasons; treating them as one field would silently break playoff-period scoring the first time it's exercised against a multi-week playoff league, which is exactly the highest-stakes period for the platform's draft/in-season features to be correct.
  **Rejected alternative:** Collapsing both into a single `week` field, as several generic cross-platform data models do, was rejected — this is a documented, repeated source of data loss specifically at the point (playoffs) where matchup accuracy matters most to users.

- **Decision:** ESPN's official `totalPoints` field on a matchup side will be treated as the authoritative score for standings, win/loss records, and playoff seeding; an independently summed player-level total will be computed only as a reconciliation/audit check, never as the source of truth.
  **Reasoning:** Commissioner adjustments and stat-correction timing can cause a player-level sum to diverge from ESPN's official total in ways the platform cannot independently reproduce or predict, and standings must match what ESPN itself displays to league members to avoid user-facing discrepancies.
  **Rejected alternative:** Computing standings purely from summed player stats was rejected — it risks displaying results that disagree with ESPN's own official numbers, which would undermine user trust in a read-only dashboard whose entire value is faithfully reflecting the source platform.

---

## Open Questions

- [ ] The exact field(s) ESPN uses to expose the matchup-period-to-scoring-period mapping within `mSettings.scheduleSettings` were described conceptually but not verified against a live payload in this ingestion pass — needs direct verification before implementation.
- [ ] Whether ESPN's own stat-correction window for matchup scoring matches the "through the following Thursday" pattern established for Sleeper is not independently confirmed for ESPN specifically — flagged as an extrapolation from a related but distinct platform, not a directly corroborated ESPN-specific claim.
- [ ] The precise field(s) that distinguish a live/in-progress total from a final/reconciled total are not consistently named across sources (`totalPoints` vs. `totalPointsLive` vs. unnamed finalization flags) — needs direct verification against a live payload during and after an active scoring period.
