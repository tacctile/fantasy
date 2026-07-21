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
---

## Summary

`GET /league/{league_id}/rosters` returns one roster object per team, built around a durable `roster_id` — the correct primary key for a team within a league — a separate and sometimes-null `owner_id` linking to the owning user, and four player-ID groupings: `players` (the full squad), `starters`, `reserve` (IR), and `taxi` (taxi squad). Standings-relevant figures live in a nested `settings` object and use a split integer-plus-decimal representation for fantasy points that must be recombined into a single value at ingestion, not read or displayed as two independent numbers.

---

## Core Knowledge

### Identity and Ownership

`roster_id` is scoped to its league and is the stable, durable identifier for a team across a season — it does not depend on who currently owns the team. `owner_id` links a roster to a Sleeper user, but this field can be null: orphaned rosters (a departed or deleted user, an unfilled league slot, a commissioner-managed team) are a normal, expected state, not an error condition or edge case that only occurs in broken leagues. Dynasty and co-managed leagues additionally support a `co_owners` array alongside the primary `owner_id`, representing shared ownership of a single roster by more than one Sleeper user.

Because ownership can be null, absent, or shared across multiple users, a roster's identity must never be derived from its owner. `roster_id` is the only field guaranteed to be stable and present for an active team within a league; owner information should be treated as an attribute of the roster that can change or disappear, not as part of the roster's key.

### Player Groupings

Four separate arrays partition a roster's players by role. `players` holds the complete squad — every rostered player ID regardless of role. `starters` holds the active lineup in an order that corresponds to the league's roster-position layout, meaning a given index in `starters` only has meaning when read against that same league's ordered lineup-slot list. `reserve` holds players currently on injured reserve. `taxi` holds taxi-squad players, a dynasty-specific concept for stashing rookies or otherwise-inactive players outside the roster's active player count and standard bench limits.

A team defense occupies a starter slot like any other position, but is represented by a team abbreviation — for example `"DET"` — rather than a numeric-style player identifier. Any code or logic that assumes every entry in `players`, `starters`, `reserve`, or `taxi` is a standard numeric-style player ID will mishandle defense entries; defense IDs need to be recognized and routed differently from ordinary player IDs during any lookup against the player directory.

### Standings and Scoring Fields

A nested `settings` object on each roster carries the standings-relevant figures: `wins`, `losses`, `ties`, `waiver_position`, `waiver_budget_used`, and `total_moves`, alongside points-for and points-against. Fantasy point totals are represented as a split integer-plus-decimal pair rather than a single decimal field — for example, a `fpts` value of `1234` paired with an `fpts_decimal` value of `56` together represent `1234.56` points. The same split pattern applies to points-against (`fpts_against` / `fpts_against_decimal`) and, in some contexts, to projected points (`ppts` / `ppts_decimal`). These are not two independent statistics; they are one number split across two fields, most plausibly to avoid floating-point representation issues in the underlying data store, and they must be recombined into a single value at the point of ingestion rather than stored or displayed as separate figures.

### Roster State During Transactions

Roster arrays reflect a point-in-time snapshot of the league's transaction state. During an active waiver run, trade processing window, or IR designation change, the `players`, `reserve`, and `taxi` arrays reflect whatever the platform's transaction processing has already committed at the moment of the request — a roster fetched mid-processing may not yet show the outcome of a transaction that has been submitted but not finalized. An integration that needs to reflect a transaction's effect promptly should rely on the transaction resource's own status field to know when a change is final, rather than inferring completion purely from a roster snapshot appearing to have changed.

### Distinguishing Roster IDs from Other Sleeper ID Domains

Sleeper's data model uses several separate ID domains that all commonly appear as plain strings and are easy to conflate: a global user ID, a global league ID, a league-scoped roster ID, a global draft ID, and a Sleeper player ID. The roster endpoint specifically deals in `roster_id` and `owner_id` — a league-local team identifier and a global user identifier, respectively — and these must not be treated as interchangeable with each other or with identifiers returned by other Sleeper resources, such as draft-pick ownership fields that are also named with "owner"-style keys but refer to roster IDs rather than user IDs in that context.

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

---

## Open Questions

- [ ] What specifically causes `owner_id` to become null on an otherwise active roster — a deleted user, a commissioner removal, or a league migration artifact — and are these distinguishable from the roster object alone? — needs a decision from Nick on how an orphaned roster should be surfaced in the product, plus confirmation against real observed Sleeper league data.
- [ ] Are `players`, `reserve`, and `taxi` guaranteed to be mutually exclusive at all times, or can a brief transactional window produce a player appearing in more than one array? — needs direct observation during a live waiver/IR transition, since available sources describe the steady-state shape but not transitional behavior.
- [ ] Does the split integer/decimal points representation ever produce a decimal component outside the expected 0-99 range (implying a different intended scale), and is this consistent across `fpts`, `fpts_against`, and `ppts`? — needs direct sampling across real league data, since no source confirms the bounds of the decimal field.
