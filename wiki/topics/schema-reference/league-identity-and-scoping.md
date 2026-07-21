---
title: "ADR: Multi-Platform League Identity and Scoping"
type: decision-record
category: schema-reference
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - league-settings
  - player-id-mapping
  - endpoint-structure
related:
  - schema-reference/player-identity-mapping
  - schema-reference/league-configuration-data-model
  - sleeper-api/league-endpoint
  - espn-api/historical-season-access
  - espn-api/team-owner-member-id-structure
---

## Context

The platform ingests league data from two providers whose native league-identity models are structurally incompatible. Sleeper mints a brand-new `league_id` every season a league renews, linking seasons backward only through an optional `previous_league_id` field — a manually recreated (non-renewed) league breaks that chain entirely. ESPN instead keeps one stable `leagueId` across every season, with the specific season selected via a separate `seasonId` parameter, and its historical-season endpoint (`leagueHistory`) returns a season-scoped array rather than treating each season as its own object. `league_id` scoping is already a non-negotiable schema rule (`MASTER_CONTEXT.md`) on every league-scoped table — this decision fixes what value actually goes in that column and how season history is threaded through it for both providers without one provider's identity model leaking into or breaking the other's.

---

## Decision

The platform will key every internal league-scoped record by an internally-generated `platform_league_uuid` — its own primary key — never by either provider's native league identifier directly.

In practice: every league record carries `platform` (`sleeper` | `espn`), `season_year`, and `native_league_id` (Sleeper's `league_id` string, or ESPN's `leagueId` integer, stored as-received). Season-to-season continuity for dynasty/keeper leagues is represented by an explicit `previous_platform_league_uuid` self-referencing column on the league record — populated at ingestion by walking Sleeper's `previous_league_id` chain and resolving each hop to its corresponding `platform_league_uuid`, and left null for ESPN leagues, since ESPN's single stable `leagueId` across seasons already makes season continuity implicit in `native_league_id` without a chain to walk. All application-layer queries and joins use `platform_league_uuid`; `native_league_id` exists only for re-querying the source API and for debugging, never as a join key.

---

## Rationale

Sleeper's and ESPN's identity models are not just different in value — they're different in *kind*. Sleeper's identity is inherently multi-valued across a league's lifetime (one native ID per season, chained); ESPN's identity is single-valued across a league's lifetime (one native ID, season selected by parameter). No single native-ID-as-primary-key convention can represent both behaviors without provider-specific branching leaking into every downstream query touching league history — exactly the kind of speculative-but-actually-necessary complexity that's better absorbed once, at the identity layer, than repeated at every call site. An internally-generated UUID sidesteps the incompatibility entirely: it's a single row per platform-season-league combination regardless of provider, and the provider-specific continuity logic (walk `previous_league_id`, or don't) lives in exactly one place — the ingestion step that creates the UUID — not scattered across the app.

The tradeoff accepted: an extra indirection layer (native ID → internal UUID) that a single-provider platform wouldn't need. This is accepted because the two providers' identity models are demonstrably incompatible, not because of hypothetical future providers — no Yahoo scaffolding, no N-platform abstraction, just the two real behaviors Sleeper and ESPN actually exhibit today.

---

## Rejected Alternatives

**Alternative 1: Use the native league ID as the primary key directly**
- Would store league-scoped data keyed on whatever `league_id`/`leagueId` the provider returns, joined by that raw value everywhere.
- Rejected because Sleeper's native ID is not stable across a league's lifetime (a new one is minted every renewal) while ESPN's is — a single native-ID-as-PK convention would either silently orphan Sleeper league history at every renewal (if treated as stable) or require ESPN-specific special-casing to avoid an unnecessary internal ID churn (if treated as unstable). Neither uniform treatment is correct for both providers simultaneously.

**Alternative 2: Store Sleeper's `previous_league_id` chain as the sole continuity mechanism, with no internal UUID**
- Would let the application walk the native `previous_league_id` chain at query time whenever season history is needed, rather than pre-resolving it into a stored self-reference at ingestion.
- Rejected because this pattern doesn't exist for ESPN at all (nothing to walk), meaning every consumer of league history would need provider-aware branching logic, and because on-demand chain-walking at query time is slower and more failure-prone (a broken or non-renewed chain mid-walk) than resolving continuity once at ingestion into a flat, always-present column.

**Alternative 3: A generic N-platform league-identity abstraction with a pluggable continuity-resolution strategy per provider**
- Would build a formal strategy-pattern interface for "how does this platform express league continuity," anticipating a third or fourth provider joining later.
- Rejected outright per `MASTER_CONTEXT.md`'s explicit prohibition on speculative platform abstraction — the platform is built for exactly Sleeper and ESPN as they actually behave, and Yahoo is deferred indefinitely with no scaffolding implied to be coming.

---

## Date

Decision made: 2026-07-21
Last reviewed: 2026-07-21
