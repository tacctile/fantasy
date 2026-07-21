---
title: "ADR: League Configuration Data Model"
type: decision-record
category: schema-reference
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - league-settings
  - scoring-configuration
  - roster-structure
related:
  - schema-reference/league-identity-and-scoping
  - schema-reference/player-identity-mapping
  - sleeper-api/league-endpoint
  - espn-api/roster-response-structure
---

## Context

`MASTER_CONTEXT.md` already mandates a `league_config` table keyed by `league_id`, storing scoring rules, roster slots, and format settings as data rather than hardcoded application assumptions — required today, not future-proofing, since Nick's leagues already have different scoring rules from each other. This decision fixes the concrete shape of that table now that both providers' settings research is complete. Sleeper exposes `scoring_settings` and `roster_positions`/`settings` objects with no official, versioned schema — the wiki's own key inventory for these is explicitly reconstructed from cross-corroborated observation, not an authoritative source, and IDP leagues carry a materially larger, distinct key family. ESPN exposes an equivalent but structurally different shape (`mSettings.rosterSettings.lineupSlotCounts` for roster slots, a separate scoring-rules payload), and the ESPN-side research explicitly rejected hardcoding a standard slot table in favor of deriving each league's actual configuration from its own settings response, since custom leagues add, remove, or resize slots.

---

## Decision

The platform will use one `league_config` table keyed by `platform_league_uuid` (per `schema-reference/league-identity-and-scoping`), with three columns: `scoring_settings_raw` (JSONB, the provider's native scoring-rules payload stored as-received — Sleeper's `scoring_settings` object, or ESPN's equivalent scoring payload), `roster_settings_raw` (JSONB, the provider's native roster-slot payload stored as-received — Sleeper's `roster_positions` array plus relevant `settings` fields, or ESPN's `mSettings.rosterSettings.lineupSlotCounts`), and `derived_config` (JSONB, a small platform-agnostic normalized subset that application code actually queries against day to day: PPR value, TE-premium flag, superflex/2-QB flag, active roster slot count, bench slot count, IR slot count, and league size).

`derived_config` is computed at ingestion from whichever raw column applies for that league's platform, and is re-derived in full on every settings refresh — it is never hand-edited or treated as an independent source of truth. Any application feature needing a setting not yet present in `derived_config` reads the relevant raw column directly rather than the platform inventing a placeholder or guessed value in the normalized layer.

---

## Rationale

`MASTER_CONTEXT.md` already settled that league configuration must be data, not hardcoded assumptions — this decision's job is deciding how much of that data gets normalized versus preserved raw. Both providers' own settings research converged on the same warning from opposite ends: Sleeper's `scoring_settings`/`roster_positions` key space is undocumented and reconstructed rather than officially specified, and the ESPN-side research explicitly rejected hardcoding a standard slot table as a minority position that conflicts with this platform's own schema rule. Both signals point the same direction — a full normalized schema would have to either guess at undocumented Sleeper keys or hardcode ESPN slot assumptions that are known to vary per league, and either move risks silently misrepresenting a specific league's actual rules.

Storing the raw payload alongside a small derived subset resolves this without contradiction: the raw column is always a faithful, complete record of exactly what that league is actually configured to do, usable for any feature the normalized layer doesn't yet cover; the derived subset exists purely as a performance and ergonomics convenience for the handful of settings (PPR value, slot counts, superflex) that essentially every player-evaluation and draft-assistant feature needs to check constantly. The tradeoff accepted is that `derived_config` will sometimes lag what a feature needs, requiring a raw-column read or a `derived_config` schema addition — accepted because that's a contained, visible gap, versus the alternative of a normalized-only schema silently misrepresenting a league's real rules with no raw record to fall back on or audit against.

---

## Rejected Alternatives

**Alternative 1: Normalize fully into one platform-neutral schema and discard the raw provider payload**
- Would define a single fixed set of scoring/roster columns (e.g., `points_per_reception`, `qb_slots`, `flex_slots`) populated from both providers, with no raw JSONB retained.
- Rejected per `MASTER_CONTEXT.md`'s explicit bar on speculative platform abstraction, and because normalization is demonstrably lossy for exactly the settings both providers' own research flagged as needing per-league verification rather than a fixed global mapping — Sleeper's undocumented `scoring_settings` key sprawl (with a materially different key family for IDP leagues) and ESPN's per-league `lineupSlotCounts`. A fully normalized schema would either drop settings it doesn't have a column for, or require a schema migration every time a league uses a setting the platform hadn't anticipated.

**Alternative 2: Store only the raw provider payload, with no derived/normalized layer at all**
- Would keep `scoring_settings_raw`/`roster_settings_raw` as the only columns, requiring every feature to parse the provider-native shape directly at read time.
- Rejected as impractical given how frequently core settings (PPR value, slot counts, superflex) are needed across nearly every player-evaluation, draft-assistant, and in-season feature — re-deriving these from two structurally different raw shapes at every call site would duplicate parsing logic across the codebase and risk inconsistent interpretation of the same underlying setting in different features.

**Alternative 3: Hardcode the standard ESPN slot table and a fixed assumed Sleeper scoring-key set as application constants**
- Would skip per-league settings ingestion for the common cases, falling back to settings data only for leagues that deviate from a hardcoded default.
- Rejected because this is the specific minority position the ESPN-side roster-response research already rejected as conflicting with this platform's own `league_config`-as-data schema rule, and because Nick's leagues are already confirmed to have differing scoring rules from each other — a hardcoded-default approach would misclassify at least one of Nick's own leagues on day one, not a hypothetical edge case.

---

## Date

Decision made: 2026-07-21
Last reviewed: 2026-07-21
