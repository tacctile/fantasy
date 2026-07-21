---
title: "Sleeper NFL State Endpoint"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - undocumented-endpoint
  - caching-strategy
  - rest-api
related:
  - sleeper-api/league-endpoint
  - sleeper-api/transactions-endpoint
  - sleeper-api/matchup-endpoint
---

## Summary

`GET /state/nfl` (and the generic `/state/{sport}` form) returns a small, unauthenticated JSON object that is Sleeper's own source of truth for "what point in the NFL calendar is it right now" — `season`, `season_type`, `week`, `leg`, `league_season`, `league_create_season`, and `display_week`. The single most important rule is to branch on `season_type` before trusting any week value, because the same integer `week` means something different in preseason, regular season, postseason, and the undocumented offseason state. `display_week` and `week` deliberately diverge around the weekly rollover boundary — using the wrong one for the wrong purpose is the most common integration bug tied to this endpoint.

---

## Core Knowledge

### Core Fields

The response carries no authentication requirement and no meaningful parameters beyond the sport in the path. The fields that matter operationally:

- `season` — the current season as a string (e.g. `"2026"`), not a number.
- `season_type` — documented values are `pre`, `regular`, and `post`. An additional value, `off`, is empirically observed during the true offseason (roughly February through July) even though it does not appear in Sleeper's own published documentation. Treat `off` as real and plan for it, but recognize it as an undocumented, non-contractual value that could change without notice.
- `week` — an integer. During `pre` it counts preseason weeks, not regular-season weeks. During `regular` it is the scoring week fantasy logic actually cares about. During `post` it keeps incrementing past the regular season's final week into the NFL postseason — it does not reset or stop at 18. The exact numbering used for postseason weeks is only lightly corroborated and should be verified against a live pull rather than assumed.
- `leg` — the week of the regular season specifically. This is the same value the transactions endpoint's `round` path parameter expects (see `sleeper-api/transactions-endpoint`, which independently documents `leg` on transaction objects as "the week the transaction belongs to, generally matching `round`"). Treat `leg` as the correct key for transaction-week alignment; its behavior outside `regular` is murkier and lower-confidence.
- `league_season` — the season leagues should currently be considered to be operating in. This can lead `season` during the winter rollover window — after the Super Bowl but before the live `season` value itself rolls forward, `league_season` can already point at the upcoming year.
- `league_create_season` — the season assigned to newly created leagues. This flips forward in December, ahead of every other season-related field, so a league created in mid-to-late December is already stamped with the next year's season.
- `display_week` — the week Sleeper's own front end renders. It diverges from `week` around the weekly boundary: once a week's games are effectively finished, `display_week` moves ahead to the upcoming week before `week` does, or vice versa depending on the transition window. It exists to make the UI readable, not to serve as a data-query key.
- `previous_season` and `season_start_date` are also present as convenience/context fields — the prior season string and the regular season's start date, respectively.

### Deciding "What Week Is It" — The Correct Procedure

There is no single "current week" — there are three distinct answers depending on what the caller is trying to do, and picking the wrong one for the wrong purpose is the most common failure mode built on this endpoint:

1. **For stats, matchups, and scoring retrieval** (which week's data to pull): use `week`, gated by `season_type`. If `season_type` is `pre` or `off`, there is no meaningful regular-season fantasy week to score — treat it as undefined rather than feeding a preseason or offseason `week` value into a matchup query.
2. **For transaction-week alignment** (the `round` parameter on the transactions endpoint): use `leg`.
3. **For anything user-facing** (what week to display, which week a user should be setting a lineup for): use `display_week`. This is what Sleeper's own app shows, and it is allowed to lead or lag the raw `week` value by one around the rollover boundary — that is expected, not a bug.

Never derive the current week from calendar date arithmetic against `season_start_date`. Thursday openers, international games, holiday schedule shifts, and bye weeks all make date-based computation fragile in ways this endpoint was built specifically to avoid.

### Edge Cases and Failure Patterns

- **The Tuesday rollover gap.** `week` and `display_week` are observed to diverge around the transition from Monday Night Football into the next calendar week — the exact timing (commonly early Tuesday, U.S. Eastern time) is empirically observed, not contractually documented, and has reportedly shifted across seasons. Code that keys matchup pulls off `display_week` right after this window can request the wrong week's data; code that keys UI display off raw `week` can show the wrong "current week" to a user during the same window.
- **Offseason ambiguity.** From roughly February through July, `season_type` reads `off`, and the season-related fields are in transition relative to each other — `season` and `league_season` can disagree for an extended period. `week`/`leg` values during this window are not meaningful and should not drive any scoring or transaction logic.
- **Preseason week inflation.** During `pre`, `week` counts preseason weeks starting from 1 — structurally identical-looking to early regular-season week numbers. Code that doesn't check `season_type` first can silently treat preseason as regular-season week 1.
- **Postseason continuation.** `week` continues incrementing past the regular season's final week into the NFL postseason rather than resetting. Most fantasy leagues finish before the NFL postseason itself concludes, so a league's own `settings.playoff_week_start` and structure (see `sleeper-api/league-endpoint`) — not this endpoint — determines when a given league's season is actually over.
- **No error signal for "wrong" state.** The endpoint always returns a valid 200 response with a well-formed object; there is no "unknown" or error state. Every failure here is semantic (using the right field for the wrong purpose), never an HTTP-level signal.
- **Type inconsistency.** `season` and `league_season`-style fields are strings; `week`, `leg`, and `display_week` are integers. Comparing a string season to an integer without normalization is a recurring low-level bug.
- **No versioning or changelog.** Sleeper has altered state-endpoint field behavior between seasons without an announced migration. Boundary-condition checks (offseason transition, week-18-to-postseason transition) are worth re-validating each season rather than assumed permanent.

---

## Key Decisions

- **Decision:** The platform will call `GET /state/nfl` to determine current NFL calendar context rather than computing the week from calendar date arithmetic.
  **Reasoning:** Schedule irregularities (international games, holiday slates, bye weeks) and the undocumented rollover timing make date-based computation fragile in exactly the ways this endpoint exists to avoid; it is Sleeper's own authoritative source for its week/season semantics.
  **Rejected alternative:** Computing the current week from `season_start_date` plus elapsed days was rejected — it breaks on schedule anomalies and provides no signal at all for offseason or preseason state.

- **Decision:** The platform will branch all NFL-state logic on `season_type` before using any week-related field, and will explicitly handle the undocumented `off` value as a real fourth state alongside `pre`, `regular`, and `post`.
  **Reasoning:** `week` is only meaningful for scoring purposes within `season_type == regular`; the `off` value is empirically real even though undocumented, and code that only recognizes the three published values will mishandle genuine offseason responses.
  **Rejected alternative:** Trusting only the three documented `season_type` values was rejected — it leaves no defined behavior for the offseason window the endpoint actually returns.

- **Decision:** The platform will use `week` (not `display_week`) as the key for matchup and stat-retrieval calls, `leg` as the key for transaction-round parameters, and will reserve `display_week` strictly for user-facing "what week is it" display.
  **Reasoning:** This matches both the majority of cross-model convergence and existing wiki precedent — `sleeper-api/transactions-endpoint` already documents `leg` as the value aligning with the transaction endpoint's `round` parameter. `display_week` is built to lead or lag the true scoring week by design around the rollover boundary, which makes it the wrong key for data retrieval.
  **Rejected alternative:** Using `display_week` universally as "the current week" was rejected — it is a UI convenience value that can diverge from the actual scoring/transaction week exactly during the boundary period when correctness matters most.

- **Decision:** The platform will drive season selection for league-creation and league-listing logic off `league_season`/`league_create_season`, not the raw `season` field, particularly during the winter rollover window.
  **Reasoning:** `season` can lag behind the season leagues are actually operating in for an extended period after the Super Bowl; `league_create_season` specifically flips forward in December, ahead of every other field, so using `season` for league-creation defaults during that window would silently target the wrong year.
  **Rejected alternative:** Using `season` uniformly everywhere was rejected — it produces silently wrong season selection for league-creation and new-season workflows run between December and early spring.

- **Decision:** The platform will cache the state response for a period on the order of minutes rather than hours, and will not treat a cached read as authoritative across a known rollover boundary (Monday night into Tuesday) during the season.
  **Reasoning:** The object changes infrequently, so short caching is cheap, but the exact rollover timing is undocumented and has shifted across seasons — treating a stale cached read as current risks exactly the failure this endpoint exists to prevent, during the highest-stakes window (live game weeks).
  **Rejected alternative:** A long or daily cache refresh was rejected — it risks serving stale week data across a live rollover window during game weeks, precisely when downstream matchup and transaction logic depends on correctness.

---

## Open Questions

- [ ] What is the exact rollover timing (day and hour, US Eastern time) that flips `week` and `display_week`, and has it materially changed across recent seasons? — needs direct season-by-season observation; available sources describe it only empirically, with no documented contract.
- [ ] Is `off` a stable, permanent `season_type` value or an internal implementation detail that could be renamed or removed without notice? — Sleeper has never documented this value.
- [ ] What is the exact numeric range `week` reaches during a full NFL postseason (whether it consistently continues to a specific ceiling), and is that numbering stable season to season? — only lightly corroborated across sources; verify against a live postseason pull before depending on exact values.
- [ ] Do `league_season` and `league_create_season` ever diverge from each other (not just from `season`), and what specifically triggers each one's flip? — sources describe them as commonly equal with separately-described flip triggers, but this has not been directly confirmed against live data across a rollover window.
