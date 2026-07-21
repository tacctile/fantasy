---
title: "Sleeper Playoff Bracket Endpoints"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: medium
tags:
  - endpoint-structure
  - ownership-model
  - scoring-configuration
  - undocumented-endpoint
related:
  - sleeper-api/matchup-endpoint
  - sleeper-api/roster-endpoint
  - sleeper-api/league-endpoint
---

## Summary

`GET /league/{league_id}/winners_bracket` and `GET /league/{league_id}/losers_bracket` (note: the correct path is `losers_bracket` — Sleeper's own documentation contains a `loses_bracket` typo) each return an array of match objects encoding the playoff tree as a small graph rather than a flat round-by-round table. Progression is expressed through `t1_from`/`t2_from` reference objects that point at a prior match's ID and specify whether the winner or loser of that match fills the slot, and final standings are derived by reading the `p` (placement) field on matches that decide a specific finish — there is no separate final-standings object anywhere in the API. The endpoint carries no scores and no week mapping; joining a bracket match to an actual result requires the league's `settings.playoff_week_start` plus the weekly matchups resource. One structural point is genuinely unresolved across current sources and is treated as an open question rather than settled fact: whether a bracket is fixed at generation or can be reseeded mid-playoffs in some league configurations.

---

## Core Knowledge

### The Two Endpoints and a Documentation Typo

`winners_bracket` is the primary elimination/championship path; `losers_bracket` is the consolation or lower bracket, used in leagues with placement games below the playoff cutoff. Sleeper's own published documentation misspells the second endpoint as `loses_bracket` in at least one place — the correct, working path is `losers_bracket`. Not every league uses both: a league without consolation play may return an empty array from `losers_bracket`, and an empty array should be read as "this bracket doesn't apply here" rather than as an error condition.

### Match Object Fields

Each element of the returned array represents one bracket match, with fields: `r` (round number, 1-indexed within that bracket), `m` (a match ID unique within that specific bracket — not guaranteed unique across the winners and losers brackets together), `t1` and `t2` (roster IDs for the two participants, populated once known and otherwise absent or null), `t1_from` and `t2_from` (reference objects describing where an as-yet-undetermined participant will come from), `w` and `l` (roster IDs of the winner and loser once the match is decided, null before), and `p` (present only on matches that decide a specific final placement — `p: 1` is the championship deciding 1st/2nd, `p: 3` is the third-place game, `p: 5` is fifth place, and so on down the ladder).

### Progression Encoding: Reference Objects, Not a Tree Structure

The critical mechanic is that a not-yet-determined participant slot is filled by a reference object of the form `{w: m}` (this slot is filled by the winner of match `m`) or `{l: m}` (filled by the loser of match `m`), found in `t1_from` or `t2_from`. Resolving the bracket means finding the match whose `m` equals the referenced ID, reading its `w` or `l` as directed, and using that roster ID to populate the downstream slot. A first-round match instead carries a literal roster ID directly in `t1`/`t2` with no `_from` reference, since there is no prior match to point to. The bracket should be modeled and resolved as a small directed graph — build a lookup keyed on `m`, then resolve each `_from` reference against it — rather than assuming any meaningful chronological or dependency order in how the array itself is returned.

### A Worked Example as a Mental Model

Sleeper's own documented example for a 6-team winners bracket is worth internalizing directly, since it demonstrates every mechanic at once: round 1 has match `m1` (seed 3 vs. seed 6) and match `m2` (seed 4 vs. seed 5). Round 2 has match `m3` (seed 1, pre-seeded directly, versus the winner of `m1`, i.e. `t2_from: {w: 1}`), match `m4` (seed 2 versus the winner of `m2`), and match `m5` (the loser of `m1` versus the loser of `m2`, i.e. both slots use `_from: {l: ...}`), which carries `p: 5` since it decides fifth place. Round 3 has the championship `m6` (winner of `m3` versus winner of `m4`, `p: 1`) and the third-place game `m7` (loser of `m3` versus loser of `m4`, `p: 3`). Two structural lessons follow directly from this: a first-round bye is represented by pre-seeding a team directly into a later round's `t1`/`t2` rather than by any explicit "bye" flag, and the winners bracket itself contains placement games for the middle of the standings (fifth place in this example), not only the championship path.

### Byes Are Encoded as Pre-Seeded Slots, Not a Separate Flag

Following directly from the worked example, a bye is not a distinct, explicitly labeled concept anywhere in the schema. It is inferred from structure: a team that received a first-round bye simply appears as a literal, pre-seeded roster ID in a round-2 (or later) match rather than having played a round-1 match of its own. Detecting a bye programmatically means comparing seed count against round-1 match count and noting which seeds do not appear in any round-1 match, rather than looking for a dedicated field.

### Placement Ladder via p

Final standings for playoff teams are reconstructed entirely by reading `p` across both brackets: the match with `p: 1` gives the champion (`w`) and runner-up (`l`); `p: 3` gives third and fourth place; and the pattern continues downward, with the losers bracket's own `p`-flagged matches typically continuing the ladder below the playoff cutoff (for example `p: 7`, `p: 9` in a format with enough consolation games to warrant it). Not every match carries a `p` value — ordinary advancement games do not — so placement must never be inferred from round number or match ID alone; only explicit `p` values are dispositive for standings.

### Winners Bracket Contains All Placement Games Among Playoff Teams

A common misreading is to treat the winners bracket as only the championship path and to expect all non-championship placement games (third place, fifth place, and so on) to live in the losers bracket instead. The worked example directly contradicts that assumption: the fifth-place game (`m5`, fed by both first-round losers) lives inside the winners bracket response, not the losers bracket. The losers bracket is a genuinely separate structure for teams that did not make the winners-bracket playoff field at all, used for consolation or "toilet bowl" formats and, in some dynasty leagues, draft-order determination.

### Losers Bracket Semantics Vary by League Format

The schema itself — match objects with `t1_from`/`t2_from`, `w`/`l`, and `p` — is identical between the two endpoints. What differs is the competitive meaning a league's settings assign to the losers bracket: it can function as an ordinary consolation ladder (playing for lower final placements) or as a "toilet bowl" format where the competitive stakes are inverted at the league-rules level. The API does not encode this distinction anywhere in the bracket payload itself — `w` and `l` consistently mean "won this individual match" and "lost this individual match" regardless of format, and interpreting what that means for a team's ultimate standing requires reading the league's own settings and format description, not the bracket structure. Treat any claim that the `w`/`l` fields themselves change meaning or invert between formats with skepticism; the better-supported model is that the fields are literal match results in every format, and only the human-facing interpretation of "losing" as good or bad varies by league rules.

### No Linkage to Weekly Matchup Data — Must Join by Roster ID and playoff_week_start

The bracket endpoints carry no scores and no explicit mapping to NFL or fantasy weeks. To attach an actual score to a bracket match, read the league's `settings.playoff_week_start` (see `sleeper-api/league-endpoint`) to determine which week corresponds to bracket round `r`, then query that week's matchups (see `sleeper-api/matchup-endpoint`) and match on roster ID. The bracket's `m` (match ID) is a bracket-local identifier and is not the same namespace as the weekly matchup endpoint's `matchup_id` — there is no direct field-level linkage between the two, and the join must be performed through roster ID and week rather than by comparing ID values across the two resources. Leagues with a two-week championship round compound this: the bracket still shows the championship as a single match object, but its result depends on two weeks of summed matchup data, and a join assuming one week per round will read an incomplete score mid-round.

---

## Key Decisions

- **Decision:** The platform will model each bracket as a directed graph keyed on `m`, resolving `t1_from`/`t2_from` references by looking up the target match and reading its `w` or `l` field as directed, rather than assuming any ordering or adjacency in the raw response array carries dependency meaning.
  **Reasoning:** The schema explicitly encodes progression through ID references, not array position; treating the array as a flat, order-significant list would misresolve any bracket where a downstream match happens to be returned before the match it depends on.
  **Rejected alternative:** Inferring progression from round number and array order alone was rejected — it is not a documented guarantee, and the graph-resolution approach handles every case correctly without relying on an assumption that could break silently.

- **Decision:** The platform will derive final placements exclusively from the `p` field across both brackets, and will never infer a team's final standing from round number, match ID, or which bracket a match appears in.
  **Reasoning:** `p` is the only field Sleeper provides that directly ties a match's outcome to a specific final standing; the worked example shows that placement games (like a fifth-place game) can appear in the winners bracket rather than being cleanly separated by bracket, so any placement logic based on bracket identity or round number alone would misclassify those games.
  **Rejected alternative:** Assuming the winners bracket determines only top standings and the losers bracket determines only bottom standings was rejected — the winners bracket can and does contain mid-ladder placement games in some formats, directly contradicting that assumption.

- **Decision:** The platform will join bracket matches to actual scores by combining the league's `settings.playoff_week_start` with round number to determine the relevant week or weeks, then querying the weekly matchups resource and matching on roster ID — never by comparing the bracket's `m` field against the matchups endpoint's `matchup_id`.
  **Reasoning:** These two identifiers exist in unrelated namespaces with no documented linkage; roster ID plus week is the only reliable join key available across both resources, and this approach already accounts for multi-week championship rounds by summing across the relevant weeks.
  **Rejected alternative:** Assuming `m` and `matchup_id` share a namespace or could be compared directly was rejected — nothing in the schema supports that assumption, and building a join on it would silently produce wrong or empty results.

- **Decision:** The platform will treat an empty array from either bracket endpoint as a normal "not applicable" state — bracket not yet generated, or losers bracket disabled for this league — rather than as an error condition requiring a retry or alert.
  **Reasoning:** Both are documented, expected situations (pre-playoff timing, or a league format that doesn't use a losers bracket at all); treating them as errors would generate false alerts for entirely normal league configurations.
  **Rejected alternative:** Treating any empty bracket response as a fetch failure was rejected — it conflates a legitimate absence of data with an actual request error, and would create noisy, incorrect error handling for common league configurations.

- **Decision:** The platform will treat bracket data as potentially subject to change during the playoff window — re-fetching brackets on each relevant weekly sync rather than fetching once at playoff start and caching indefinitely — given the current, unresolved disagreement in available sources about whether some league configurations allow mid-playoff reseeding.
  **Reasoning:** Sources directly conflict on whether brackets are immutable once generated or can have their `t1_from`/`t2_from` targets updated by Sleeper after a round completes under a reseeding-enabled league setting; re-fetching each week is the safer default until this is resolved empirically, at negligible cost given how infrequently playoff weeks occur relative to the regular season.
  **Rejected alternative:** Fetching the bracket once at playoff generation and treating it as permanently cached was rejected for now — if reseeding does occur in some league configurations, a permanently cached bracket would silently display stale, incorrect future matchups for the remainder of the playoffs.

---

## Open Questions

- [ ] **Unresolved contradiction:** do Sleeper playoff brackets remain fixed once generated (no reseeding, `t1_from`/`t2_from` references never change after creation), or can a league setting enable reseeding that causes Sleeper to reassign later-round `t1_from`/`t2_from` targets after each round completes? Available synthesis sources directly disagree on this point — see `wiki/verification-cache.md` for the logged conflict. Needs direct empirical testing against a live league with reseeding-style settings enabled, since no source provides a verifiable, specific mechanism either way.
- [ ] Is match ID `m` guaranteed unique only within its own bracket, or can the same `m` value appear in both `winners_bracket` and `losers_bracket` responses for the same league without collision risk? — needs direct sampling against a live league with both brackets populated.
- [ ] Does the `p` placement ladder in the losers bracket reliably continue the numeric sequence from the winners bracket's placements (e.g. picking up at `p: 7` in a 12-team league with a 6-team playoff), or does its exact continuation vary by league format? — needs direct sampling across leagues with different playoff and consolation sizes.
- [ ] Is there any field-level signal distinguishing an unplayed match (`w`/`l` both null, genuinely not yet started) from a match that is in-progress with a live, uncommitted score — or must both states be inferred identically as "not yet decided"? — needs direct observation of a bracket response captured while a playoff game is actively in progress.
