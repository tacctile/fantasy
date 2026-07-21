---
title: "Sleeper Roster Endpoint Structure"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - roster-structure
  - ownership-model
  - player-id-mapping
related:
  - sleeper-api/authentication
  - sleeper-api/league-endpoint
  - sleeper-api/matchup-endpoint
  - sleeper-api/draft-endpoint
  - sleeper-api/users-endpoint
  - sleeper-api/transactions-endpoint
  - sleeper-api/user-leagues-endpoint
  - sleeper-api/playoff-bracket-endpoint
  - sleeper-api/players-endpoint
---

## Summary

`GET /league/{league_id}/rosters` returns one roster object per team, built around a durable `roster_id` — the correct primary key for a team within a league — a separate and sometimes-null `owner_id` linking to the owning user, and four player-ID groupings: `players` (the full squad), `starters`, `reserve` (IR), and `taxi` (taxi squad). Standings-relevant figures live in a nested `settings` object and use a split integer-plus-decimal representation for fantasy points that must be recombined into a single value at ingestion, not read or displayed as two independent numbers. Critically, Sleeper does not return an explicit bench array — bench must be derived by the caller through set subtraction, and a naive derivation that omits reserve and taxi is a common integration bug.

---

## Core Knowledge

### Identity and Ownership

`roster_id` is scoped to its league and is the stable, durable identifier for a team across a season — it does not depend on who currently owns the team. `owner_id` links a roster to a Sleeper user, but this field can be null: orphaned rosters (a departed or deleted user, an unfilled league slot, a commissioner-managed team) are a normal, expected state, not an error condition or edge case that only occurs in broken leagues. Dynasty and co-managed leagues additionally support a `co_owners` array alongside the primary `owner_id`, representing shared ownership of a single roster by more than one Sleeper user.

Because ownership can be null, absent, or shared across multiple users, a roster's identity must never be derived from its owner. `roster_id` is the only field guaranteed to be stable and present for an active team within a league; owner information should be treated as an attribute of the roster that can change or disappear, not as part of the roster's key.

### Player Groupings

Four separate arrays partition a roster's players by role. `players` holds the complete squad — every rostered player ID regardless of role, including players currently on reserve or taxi. `starters` holds the active lineup in an order that corresponds to the league's roster-position layout, meaning a given index in `starters` only has meaning when read against that same league's ordered lineup-slot list, specifically the subset of that list excluding `BN`, `IR`, and `TAXI` labels. `reserve` holds players currently on injured reserve. `taxi` holds taxi-squad players, a dynasty-specific concept for stashing rookies or otherwise-inactive players outside the roster's active player count and standard bench limits.

An empty starting slot is not omitted from `starters` — it is represented in place, either as a null entry or as a placeholder value, depending on state. Code that walks `starters` positionally against `roster_positions` must handle these placeholder entries explicitly rather than assuming every element is a populated player ID.

A team defense occupies a starter slot like any other position, but is represented by a team abbreviation — for example `"DET"` — rather than a numeric-style player identifier, consistent with how canonical player IDs are structured across the whole API (see `sleeper-api/players-endpoint` for the full ID scheme and its cross-provider crosswalk). Any code or logic that assumes every entry in `players`, `starters`, `reserve`, or `taxi` is a standard numeric-style player ID will mishandle defense entries; defense IDs need to be recognized and routed differently from ordinary player IDs during any lookup against the player directory.

### Bench Must Be Derived — There Is No Bench Array

Sleeper does not return a dedicated bench array on the roster object. A team's bench is not directly represented anywhere in the response; it must be computed by the caller as a set difference: take `players` (the full squad) and remove every ID that also appears in `starters`, `reserve`, and `taxi`. The most common version of this bug in practice is computing bench as only `players` minus `starters`, which leaves reserve (IR) and taxi players misclassified as bench players — since `players` includes reserve and taxi occupants, both of those groups must be explicitly subtracted, not just the starting lineup. Any feature that displays, counts, or reasons about a team's bench must implement this full three-way subtraction, not a two-way one.

### Standings and Scoring Fields

A nested `settings` object on each roster carries the standings-relevant figures: `wins`, `losses`, `ties`, `waiver_position`, `waiver_budget_used`, and `total_moves`, alongside points-for and points-against. Fantasy point totals are represented as a split integer-plus-decimal pair rather than a single decimal field — for example, a `fpts` value of `1234` paired with an `fpts_decimal` value of `56` together represent `1234.56` points. The same split pattern applies to points-against (`fpts_against` / `fpts_against_decimal`) and, in some contexts, to projected points (`ppts` / `ppts_decimal`). These are not two independent statistics; they are one number split across two fields, most plausibly to avoid floating-point representation issues in the underlying data store, and they must be recombined into a single value at the point of ingestion rather than stored or displayed as separate figures.

### Current Snapshot, Not Historical Record

The roster endpoint reflects current state only — it is not a per-week historical record. A team's `starters` on this endpoint show the lineup as currently set, which is only meaningful for the upcoming or in-progress week; it does not preserve what a team's lineup was in a past week. Week-specific historical lineups and the points those lineups actually scored live on the matchups resource (queried per week), not on the roster endpoint. An integration that needs to show or compute a team's lineup and score for a completed week should read that week's matchup data, not infer it from the current roster snapshot.

### Roster State During Transactions

Roster arrays reflect a point-in-time snapshot of the league's transaction state. During an active waiver run, trade processing window, or IR designation change, the `players`, `reserve`, and `taxi` arrays reflect whatever the platform's transaction processing has already committed at the moment of the request — a roster fetched mid-processing may not yet show the outcome of a transaction that has been submitted but not finalized. An integration that needs to reflect a transaction's effect promptly should rely on the transaction resource's own status field to know when a change is final, rather than inferring completion purely from a roster snapshot appearing to have changed. See `sleeper-api/transactions-endpoint` for the full transaction object structure and its own status-filtering pitfalls.

### Distinguishing Roster IDs from Other Sleeper ID Domains

Sleeper's data model uses several separate ID domains that all commonly appear as plain strings and are easy to conflate: a global user ID, a global league ID, a league-scoped roster ID, a global draft ID, and a Sleeper player ID (documented in full, including its canonical numeric-vs-team-abbreviation scheme, on `sleeper-api/players-endpoint`). The roster endpoint specifically deals in `roster_id` and `owner_id` — a league-local team identifier and a global user identifier, respectively — and these must not be treated as interchangeable with each other or with identifiers returned by other Sleeper resources, such as draft-pick ownership fields that are also named with "owner"-style keys but refer to roster IDs rather than user IDs in that context. The global `user_id` used here is the identical identity key resolved and discovered via `sleeper-api/user-leagues-endpoint`.

---

## Key Decisions

- **Decision:** The platform will key every roster internally by the pair (`league_id`, `roster_id`), and will maintain a separate, independently refreshed roster-to-owner mapping via `owner_id` rather than treating ownership as part of a roster's identity.
  **Reasoning:** `owner_id` can be null, and ownership can change without the roster itself changing identity; `roster_id` is the only field guaranteed to be stable and present for an active team within a league.
  **Rejected alternative:** Keying rosters by owner user ID was rejected outright — orphaned or commissioner-managed rosters have no valid owner to key against, and co-owned rosters would produce an ambiguous key.

- **Decision:** The platform will parse `fpts`/`fpts_decimal` (and the equivalent points-against and projected-points pairs) into a single combined decimal value at ingestion time, and will never pass the raw split integer/decimal fields through to storage or the UI layer unprocessed.
  **Reasoning:** The split representation is a wire-format detail, not two meaningful separate figures; displaying or storing only the integer portion is an easy, high-visibility scoring-precision bug that would understate every score shown to a user.
  **Rejected alternative:** Passing the two raw fields straight through to the display layer for it to combine was rejected — pushing a wire-format quirk downstream increases the number of places a recombination bug could be introduced.

- **Decision:** The platform will maintain an explicit defense-entity table (team abbreviation to canonical defense identity) and route any `players`/`starters`/`reserve`/`taxi` entry matching that table through defense-specific handling, rather than joining every roster entry against the player directory uniformly.
  **Reasoning:** Defense entries use team abbreviations instead of standard player IDs; a uniform join against the player directory would fail or silently mishandle every team defense on every roster.
  **Rejected alternative:** Treating defenses as an edge case handled ad hoc wherever a lookup happens to break was rejected in favor of a single, explicit defense-routing step applied consistently everywhere roster player IDs are consumed.

- **Decision:** The platform will compute bench as a strict three-way set subtraction (`players` minus `starters` minus `reserve` minus `taxi`) in a single shared utility function, rather than deriving it ad hoc wherever bench is needed.
  **Reasoning:** Sleeper provides no bench array, and the most common version of this derivation bug — subtracting only `starters` — silently misclassifies reserve and taxi players as bench; centralizing the correct three-way subtraction in one place prevents that bug from being reintroduced in a second call site.
  **Rejected alternative:** Deriving bench inline at each point of use (matchup views, roster views, lineup-setting UI) was rejected because it creates multiple independent chances to reintroduce the two-way subtraction bug.

- **Decision:** The platform will source week-specific historical lineups and scores from the matchups resource, and will not attempt to reconstruct a past week's lineup from the current roster endpoint's `starters` array.
  **Reasoning:** The roster endpoint is a current-state snapshot; it does not retain what a team's lineup was in a prior week, so any historical-lineup feature built against it would be silently wrong for every week except the current one.
  **Rejected alternative:** Caching each week's roster snapshot ourselves as a substitute for historical matchup data was rejected — Sleeper already exposes purpose-built per-week matchup data, and duplicating that via our own snapshots would be a maintenance burden with no benefit over reading the resource that Sleeper already provides for this purpose.

---

## Open Questions

- [ ] What specifically causes `owner_id` to become null on an otherwise active roster — a deleted user, a commissioner removal, or a league migration artifact — and are these distinguishable from the roster object alone? — needs a decision from Nick on how an orphaned roster should be surfaced in the product, plus confirmation against real observed Sleeper league data.
- [ ] Are `players`, `reserve`, and `taxi` guaranteed to be mutually exclusive at all times, or can a brief transactional window produce a player appearing in more than one array? — needs direct observation during a live waiver/IR transition, since available sources describe the steady-state shape but not transitional behavior.
- [ ] Does the split integer/decimal points representation ever produce a decimal component outside the expected 0-99 range (implying a different intended scale), and is this consistent across `fpts`, `fpts_against`, and `ppts`? — needs direct sampling across real league data, since no source confirms the bounds of the decimal field.
- [ ] What exact placeholder value (`null` vs. an empty-string-like sentinel) does Sleeper use for an empty starting slot in `starters`, and is it consistent across league states? — needs direct sampling against live rosters with intentionally empty lineup slots, since sources describe the existence of placeholders but not a single consistent sentinel value.
