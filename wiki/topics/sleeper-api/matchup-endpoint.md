---
title: "Sleeper Matchup Endpoint Structure"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - scoring-configuration
  - player-id-mapping
  - undocumented-endpoint
related:
  - sleeper-api/roster-endpoint
  - sleeper-api/league-endpoint
  - sleeper-api/playoff-bracket-endpoint
  - sleeper-api/nfl-state-endpoint
  - sleeper-api/player-data-quirks
---

## Summary

`GET /league/{league_id}/matchups/{week}` returns one object per roster for that week, not one object per head-to-head contest — a 12-team league returns 12 objects, and pairings must be reconstructed by grouping objects that share the same `matchup_id`. Each object carries the roster's total `points`, an optional commissioner `custom_points` override that takes precedence when present, an ordered `starters` array whose index only has meaning when read against the league's `roster_positions` layout, and a `players_points` map covering the full roster including bench. The endpoint has no live/final-score flag, no median-league result, and no playoff-bracket context — all three must be sourced elsewhere or computed by the caller. Scores in progress or newly completed should always be treated as provisional: official stat corrections are corroborated to continue for multiple days after a game ends, most commonly cited as extending through the Thursday following the game week.

---

## Core Knowledge

### Response Shape: One Row Per Roster, Not One Object Per Matchup

The endpoint's response grain is the single fact every other detail depends on: it returns an array with one entry per roster participating in that week, never a paired "matchup" object with home/away sides. There is no `opponent` field anywhere in the payload. Two rows sharing the same non-null `matchup_id` are the two sides of one contest, and reconstructing the week's schedule is an explicit grouping operation the caller must perform — Sleeper does not do it for you. A safe compound key for a matchup group is the triple of league ID, week, and `matchup_id`; `matchup_id` alone is not a durable or globally meaningful identifier; it resets in scope every week and has no relationship across weeks (a `matchup_id` of 1 in week 3 has no connection to `matchup_id` 1 in week 4). The `{week}` path parameter should be sourced from `sleeper-api/nfl-state-endpoint`'s `week` field (gated by `season_type == regular`), not from `display_week` or from calendar-date computation — using `display_week` here can request the wrong week's data around the Monday-to-Tuesday rollover boundary.

### Field Reference

`roster_id` ties the row to the roster in the rosters endpoint and is the correct join key — `user_id` never appears on this endpoint at all. `matchup_id` is the weekly pairing/grouping key described above, and is `null` for a roster with no head-to-head opponent that week (see bye handling below). `points` is the roster's total score for the week under the league's scoring settings, computed by Sleeper. `custom_points` is normally `null`, populated only when a commissioner manually overrides the computed score for that roster that week. `starters` is an ordered array of player ID strings; the order corresponds positionally to the league's `roster_positions` array (from the league object), so a given index in `starters` only has meaning once zipped against that same league's ordered slot list. `starters_points` is an array of floats positionally aligned with `starters` — index i in one corresponds to index i in the other. `players` is the full roster for that week, starters plus bench. `players_points` is a map from player ID to points covering everyone in `players`, which is what makes bench-scoring and optimal-lineup analysis possible without independently recomputing every player's score.

### Reconstructing Pairings by Grouping on matchup_id

The correct operation to recover a week's schedule is: group every row in the response by `matchup_id`, discarding nulls from the grouping (do not treat every null-`matchup_id` roster as belonging to one giant contest together). In an ordinary head-to-head week, the expected and by far most common group size is exactly two. Robust ingestion should not hard-code that assumption, though — it should explicitly validate group size and treat anything other than two as a signal to inspect further, rather than silently forcing a pairwise interpretation. Playoff weeks, leagues with an odd team count, consolation brackets, and bye weeks are the situations most likely to produce group sizes other than two.

### Scoring Precedence: custom_points Overrides points When Present

When a commissioner has not touched a roster's score, `points` is the authoritative total. When `custom_points` is non-null, it represents a deliberate manual override and should be treated as the effective result for that roster that week — the app itself displays the override value over the computed one. The one caveat worth carrying into any standings-replication feature: Sleeper does not publish a single formally documented precedence formula, so if a feature needs to exactly reproduce official league standings, the effective score derived this way should be spot-checked against the league's own displayed result rather than assumed correct purely from the field's presence. For ordinary scoring and lineup analytics, preferring `custom_points` when non-null and falling back to `points` otherwise is standard, well-corroborated practice.

### Live Scoring Has No Finality Signal

`points`, `starters_points`, and `players_points` update continuously while games are in progress, and can shift again afterward as the NFL issues stat corrections. The payload carries no "final" or "settled" flag of any kind — there is no field that tells the caller whether a given read reflects a completed, corrected, permanent result or an in-flight snapshot. Any feature that stores or displays a week's score needs its own retrieval timestamp and its own notion of when a week is safe to treat as final; the endpoint provides no help distinguishing "not started yet" from "final" — both can present as a low or zero-value payload, and this same null/zero ambiguity extends to bye-week players specifically, covered in full on `sleeper-api/player-data-quirks`.

During live play, provisional stat attribution can also flip mid-game independent of the post-week correction cycle described below — a play briefly credited to the wrong player (common on laterals, fumble scrums, or plays with similar jersey numbers involved) can cause a live point value to spike and then revert within the same game. Any feature reacting to live point deltas (alerting, win-probability, and similar) needs to tolerate negative in-game corrections, not just post-game ones.

### Stat-Correction Window and a Practical Finality Heuristic

Beyond the live in-game corrections described above, official NFL stat corrections are corroborated across multiple independent sources as continuing for a period after a game has ended — most commonly cited as extending through the Thursday following the game week, though the exact cutoff and whether it is a hard boundary is not something Sleeper documents formally. This means "all games for the week have ended" and "the score is final" are two different states, and a feature that snapshots a score immediately after the last game of the week risks locking in a number that later changes without any signal from the endpoint itself.

Team defense and IDP (individual defensive player) scoring are corroborated as the categories most exposed to this volatility: points-allowed brackets and yards-allowed brackets can only fully settle once a game is over, and sack, tackle, and turnover attribution for defensive scoring is revised more frequently than offensive skill-position stats. A DST or IDP-heavy league's live and immediate-post-game numbers should be treated as structurally less trustworthy than a skill player's, even after the games themselves have ended.

Because no finality flag exists, a practical heuristic — not a documented Sleeper contract — is to treat a week's score as operationally final only once all of the following hold: every game for the week has completed, a reasonable correction-window delay has passed (commonly through the following Thursday), repeated reads of the endpoint have returned a stable, unchanging value, and no pending commissioner action is expected. This is a policy the platform must implement itself; nothing in the response signals it directly.

### Generic Default-Scored Fields vs. League Custom Scoring — A Common Confusion Trap

Sleeper's raw per-player stats surfaces (documented separately from this endpoint) commonly expose precomputed convenience fields such as `pts_std`, `pts_ppr`, and `pts_half_ppr` alongside the raw stat counts. These convenience fields reflect Sleeper's own default scoring presets, not the specific league's actual `scoring_settings` — a league running a custom points-per-reception value, TE-premium bonus, or non-standard passing-touchdown value will see this endpoint's own `points`/`players_points` diverge from those generic fields, sometimes substantially, and that divergence is expected behavior rather than a bug. Any feature that needs to recompute or independently verify a league's scoring must apply that specific league's `scoring_settings` (from `sleeper-api/league-endpoint`) against raw per-stat counts — never substitute a generic default-scored convenience field for a league-accurate calculation, and never assume this endpoint's own `points` value is directly comparable to a number computed from those generic fields.

### Cross-Platform Correction-Timing Divergence

For any feature that reconciles Sleeper data against another platform or an independent stats provider, expect small, non-error discrepancies even after a week is fully settled on both sides. Different platforms run their own stat pipelines and apply corrections on their own schedules, so the same real-world game can produce slightly different finalized fantasy point totals on Sleeper versus another platform — not because the scoring rules differ, but because the underlying stat snapshot each platform corrected against, and the timing of that correction, differ. This is corroborated across multiple sources as a real, recurring pattern rather than an occasional anomaly, and it is directly relevant to any future cross-platform reconciliation work this platform takes on (see the ESPN integration notebook and the schema-reference decisions on multi-platform data, once both are ingested) — Sleeper's `points` should be treated as authoritative for Sleeper-side results, not as a ground truth that another platform's numbers must exactly match.

### Median-Scoring Leagues Are Invisible to This Endpoint

In leagues that score against the weekly league median in addition to head-to-head record (a `league_average_match`-style setting on the league object), the extra median win/loss is not represented anywhere in the matchups response. The only way to know a roster's median result for the week is to independently compute the median of every roster's `points` for that week and compare. A team's win total recorded in the roster object's own `settings` can legitimately exceed what's derivable from head-to-head pairings alone in these leagues — that discrepancy is expected behavior in a median league, not a data integrity bug, and standings reconciliation logic needs to account for it rather than assume head-to-head grouping is the complete picture.

### Playoff Bracket Structure Lives on a Separate Endpoint

This endpoint keeps returning ordinary roster-week rows during playoff weeks, including for eliminated and consolation teams, but it carries no bracket semantics whatsoever — no round label, no seeding, no indication of which weeks constitute a single advancement round. That structure lives on the league's separate bracket resources (`sleeper-api/playoff-bracket-endpoint`), whose entries carry their own round and match identifiers plus advancement pointers between rounds, resolved via reference objects rather than a flat schedule. Multi-week playoff rounds appear here only as separate per-week matchup rows that must be summed; the bracket resource, not this one, is what tells a caller which weeks belong to which round — and even the bracket resource requires combining `settings.playoff_week_start` (see `sleeper-api/league-endpoint`) with round number to know exactly which week or weeks a given round covers. Do not attempt to infer bracket structure purely from a week's `matchup_id` values, and do not assume the bracket's own match ID shares a namespace with this endpoint's `matchup_id`.

### Player ID Handling and Team Defenses

Every player identifier in `starters`, `players`, and the keys of `players_points` is a string, consistent with identifier handling across the rest of the API. A team defense occupies a starting slot exactly like any other position but is represented by a team abbreviation string rather than a numeric-style player ID — any lookup against a player directory needs to recognize and route defense entries separately rather than assuming every ID resolves the same way. An empty starting slot is represented in place within `starters` rather than omitted, consistent with the same placeholder behavior already logged as unresolved on the roster endpoint page; code walking `starters` positionally must handle these placeholder entries explicitly.

### Best Ball Lineups Are Platform-Optimized, Not Manually Submitted

In best-ball leagues, the `starters` array reflects Sleeper's own retroactive lineup optimization rather than a lineup a manager actively set — and that optimization is only finalized after the relevant games complete. A mid-week read of `starters` in a best-ball league is provisional in a stronger sense than an ordinary managed league: it isn't just that scores can still change, it's that which players count as "started" can still change. Best-ball matchup data should be treated as a distinct interpretation regime rather than folded into the same assumptions used for manager-set lineups.

---

## Key Decisions

- **Decision:** The platform will reconstruct weekly matchups by grouping raw matchup rows on the compound key (`league_id`, `week`, `matchup_id`), explicitly excluding null `matchup_id` rows from grouping, and will validate rather than assume a group size of two before applying head-to-head pairing logic.
  **Reasoning:** `matchup_id` is only meaningful within a single league-week response, and non-standard group sizes occur in real, non-error situations (byes, odd team counts, consolation formats); silently forcing every group into a pair would misrepresent those weeks.
  **Rejected alternative:** Assuming array adjacency or a fixed group size of two everywhere was rejected — both approaches produce silently wrong pairings the first time a league hits a bye week or an irregular bracket format.

- **Decision:** The platform will store raw `points` and `custom_points` as separate fields, and will compute an effective score as `custom_points` when non-null, else `points`, for any standings or result-facing feature — while validating that effective score against the league's own displayed result before treating it as authoritative for standings replication.
  **Reasoning:** This matches the app's own display behavior and the strong cross-model consensus on precedence, while guarding against the one genuinely unresolved nuance — Sleeper does not publish a single formal precedence contract, so blind trust in the derived value is riskier for standings-critical features than for general scoring analytics.
  **Rejected alternative:** Using `points` unconditionally and ignoring `custom_points` was rejected outright — it would silently diverge from official results in any league where a commissioner has ever made a manual adjustment.

- **Decision:** The platform will snapshot matchup reads with a retrieval timestamp and will not treat any single read as final; a week's score is only promoted to "final" internally after all games have completed, a correction-window delay (through the following Thursday, at minimum) has passed, and repeated reads return a stable value — not based on any signal in the payload itself.
  **Reasoning:** The endpoint provides no finality flag, in-progress and freshly-completed reads are known to shift due to live scoring and post-game stat corrections, and DST/IDP scoring specifically is corroborated as prone to correction well after a game ends; without an internal finality policy, the platform would intermittently display and store numbers that later change without explanation.
  **Rejected alternative:** Treating the first successful read after a game's scheduled end time as final was rejected — post-game stat corrections are common enough, and extend far enough past game end, that this would lock in numbers likely to require silent correction later.

- **Decision:** The platform will always compute or verify league-accurate scoring from raw per-stat counts against that specific league's `scoring_settings`, and will never substitute a generic default-scored convenience field (such as a standard- or PPR-preset points value from Sleeper's raw stats surfaces) for a league-specific calculation.
  **Reasoning:** Generic default-scored fields reflect Sleeper's own presets, not the league's actual configuration, and are corroborated to diverge from this endpoint's own `points` value in any league running custom scoring — treating them as interchangeable would silently misstate scores for exactly the leagues most likely to have customized settings.
  **Rejected alternative:** Using a generic default-scored field as a shortcut for league scoring was rejected — it produces plausible-looking but incorrect numbers for any league that isn't running Sleeper's exact default preset.

- **Decision:** The platform will compute median-league results (median win/loss) independently from all rosters' `points` values for the week, rather than relying on head-to-head `matchup_id` grouping to reproduce standings in leagues with median scoring enabled.
  **Reasoning:** The endpoint has no representation of median results at all; only the roster object's own `settings.wins`/`settings.losses` reflects the true record in a median league, and reconciliation logic needs to expect and explain the resulting gap versus pure head-to-head derivation.
  **Rejected alternative:** Ignoring median scoring and deriving standings purely from matchup pairings was rejected — it produces systematically wrong win totals for any league using this common format.

- **Decision:** The platform will source playoff bracket structure (round labeling, advancement, seeding, and final placement) exclusively from the league's bracket resources (`sleeper-api/playoff-bracket-endpoint`), and will treat this matchup endpoint purely as a per-week roster-score source even during playoff weeks.
  **Reasoning:** This endpoint carries zero bracket semantics; attempting to infer round or advancement from `matchup_id` values or week numbers alone is unsupported by the data and would break on any non-standard bracket size or consolation-ladder configuration.
  **Rejected alternative:** Inferring playoff structure heuristically from week number and league settings was rejected — the bracket resources exist precisely to make this unnecessary and more reliable.

- **Decision:** When reconciling Sleeper results against another platform or independent stats provider (including future ESPN integration work), the platform will treat small post-final discrepancies as expected correction-timing divergence rather than a data-quality bug, and will treat Sleeper's own `points` as authoritative for Sleeper-side results rather than attempting to force exact agreement with another provider's finalized numbers.
  **Reasoning:** Different platforms correct stats on their own schedules against their own stat snapshots, and this is corroborated as a real, recurring source of small cross-platform divergence rather than an occasional anomaly — building reconciliation logic that expects exact agreement would generate false-positive data-quality alerts on ordinary, expected behavior.
  **Rejected alternative:** Treating any cross-platform score mismatch as a bug to be resolved was rejected — it misdiagnoses an expected characteristic of independently-corrected, independently-timed stat pipelines as a defect in this platform's own ingestion.

---

## Open Questions

- [ ] What is the exact placeholder value Sleeper uses for an empty `starters` slot on this endpoint — the same open question already logged on `sleeper-api/roster-endpoint` — and is it consistent across league states and formats? — needs direct sampling against live matchup responses with intentionally empty lineup slots.
- [ ] Does Sleeper publish or intend any formal precedence contract between `points` and `custom_points`, or is the app's display behavior (prefer override when present) the only available signal? — needs either direct confirmation from Sleeper or systematic comparison against displayed league results across a range of leagues that use manual score overrides.
- [ ] Does the alignment between this endpoint's `matchup_id` and the bracket resource's match identifier hold reliably across every bracket size and consolation-ladder configuration during playoff weeks? — needs direct sampling against real leagues using non-standard playoff formats, since available sources converge on ordinary bracket shapes but not exhaustively on unusual ones. Note: `sleeper-api/playoff-bracket-endpoint` treats these as two entirely separate ID namespaces requiring a roster-ID-and-week join rather than a direct ID comparison — this question is about whether that join is airtight in every configuration, not whether the IDs themselves ever coincide.
- [ ] Is the commonly-cited "corrections through Thursday" window a hard, documented cutoff or an empirically-observed norm that can vary by week or season? — no source provided an authoritative citation; treat it as a reasonable planning assumption for a finality heuristic rather than a guaranteed contract.
- [ ] When a post-window stat correction does change underlying player stats, does Sleeper automatically recompute affected historical `points`/standings, or can this require manual commissioner action? — sources disagreed on whether recalculation is automatic, and only one gave a specific (unverified) manual-recalculation mechanism; needs direct observation of a real corrected week to resolve.
