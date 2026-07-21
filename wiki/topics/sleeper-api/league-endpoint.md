---
title: "Sleeper League Endpoint Structure"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - league-settings
  - scoring-configuration
  - undocumented-endpoint
related:
  - sleeper-api/roster-endpoint
  - sleeper-api/authentication
---

## Summary

The Sleeper league endpoint (`GET /league/{league_id}`) returns a single league object built around three core substructures — `settings` (operational configuration), `scoring_settings` (a stat-key-to-point-value map), and `roster_positions` (the full lineup slot layout, including bench and reserve slots) — alongside top-level identity and lifecycle fields. The endpoint's overall shape is well-corroborated and stable; the main practical hazard is that `settings` and `scoring_settings` are not exhaustively documented key sets, so an integration must tolerate unrecognized keys rather than assume a fixed schema.

---

## Core Knowledge

### Top-Level League Object

The league object carries identity and lifecycle fields alongside the three core substructures: `league_id`, `name`, `season` (a string, e.g. `"2026"`, not a number), `sport`, `status`, `total_rosters`, `draft_id`, `avatar`, and `metadata`. Dynasty and keeper leagues additionally carry `previous_league_id`, letting an integration walk a league's history backward season by season — though this chain is not guaranteed to be unbroken, since commissioner resets, league recreations, or platform-side migrations can sever it. Newer league formats, notably best-ball, introduce additional fields such as `company_id` that do not appear on standard redraft or dynasty leagues. Playoff bracket identifiers (`bracket_id`, `loser_bracket_id`) also live at this top level, pointing to the separate bracket resources rather than embedding bracket data directly.

League `status` progresses through a small set of lifecycle values — commonly `pre_draft`, `drafting`, `in_season`, and `complete` — that gate which nested and related resources are meaningfully populated. Requesting matchup or transaction data before a league reaches `in_season` typically yields empty results rather than an explicit error, so an integration should treat lifecycle status as the signal for which downstream calls are worth making, not rely on error codes to detect an unready league.

### League Renewal Creates a New League ID Every Season

A commissioner renewing a league into a new season does not reuse the prior season's `league_id` — Sleeper generates a fresh `league_id` for the new season's league object and links it back to the prior season via `previous_league_id` on the new league. This is one of the most common integration mistakes for multi-season (dynasty/keeper) support: any code that assumes a single stable `league_id` persists across seasons for the same league will silently lose the connection at every renewal. An integration that needs to track a dynasty league across seasons must walk the `previous_league_id` chain explicitly rather than caching a single `league_id` as a long-lived key, and must handle the case where a commissioner recreates a league manually (rather than using the platform's renewal path) and the chain is simply absent.

### Draft ID Does Not Always Capture Every Draft

The top-level `draft_id` field points to a single associated draft, but a league can have more than one draft over its lifetime — most commonly a startup dynasty draft plus one or more rookie or supplemental drafts in later seasons. Relying on the top-level `draft_id` alone will miss these additional drafts. An integration that needs a league's complete draft history should call the league's drafts listing resource rather than trusting the single `draft_id` field to be exhaustive.

### Settings

The `settings` object holds the bulk of league operational configuration. Playoff structure is controlled by `playoff_week_start`, `playoff_teams`, `playoff_type`, and `playoff_round_type`. Roster mechanics are controlled by `reserve_slots`, `taxi_slots`, `max_keepers`, `pick_trading`, and `best_ball`. Waiver behavior spans `waiver_type`, `waiver_day_of_week`, `waiver_clear_days`, `waiver_budget`, `disable_adds`, and a family of daily-waiver-specific fields governing leagues that process waivers continuously rather than on a single weekly clear day. General league parameters include `num_teams`, `start_week`, `trade_deadline`, and `draft_rounds`. A family of `reserve_allow_*` flags (covering designations such as out, doubtful, questionable, suspended, and non-designated-for-return) controls which injury statuses make a player eligible for a reserve/IR slot in that league.

Boolean-style settings (for example `best_ball`, `pick_trading`, and several `reserve_allow_*` and `taxi_allow_*` flags) are frequently represented as the integers `0`/`1` rather than JSON `true`/`false`. Integrations should not assume a native boolean type when parsing `settings` — coerce on read rather than expecting strict JSON boolean values.

The exact key set present on a given league depends heavily on its format and the era in which it was created. Older leagues and newer formats do not carry an identical settings schema, and new keys have appeared over time without any formal migration notice or version bump. Sleeper's own published documentation shows only a skeletal placeholder for this object rather than an enumerated schema — the full key inventory used on this page is reconstructed entirely from cross-corroborated community observation of live league responses, not from an official source. An integration that hard-codes an expected key list will silently miss newer fields and should instead treat `settings` as an open map, surfacing recognized keys explicitly while preserving unrecognized ones rather than discarding them.

### Scoring Settings

`scoring_settings` is a flat map from stat abbreviation to point value. Commonly observed keys include `pass_yd`, `pass_td`, `pass_int`, `rush_yd`, `rush_td`, `rec`, `rec_yd`, `rec_td`, `fum_lost`, `fgm`, `xpm`, `def_td`, `def_sack`, and `st_td`, but this is not a documented, exhaustive list — leagues can and do carry additional or unusual keys reflecting custom scoring rules, bonus thresholds, or position-specific scoring not covered by the common set. Leagues with Individual Defensive Player (IDP) scoring enabled carry a materially larger and distinct key family (tackle, sack-yardage, QB-hit, and tackle-for-loss style keys among others) that is entirely absent from standard offense-only leagues — an integration that only recognizes standard-format keys will silently drop all scoring detail for an IDP league rather than erroring.

A missing key generally means "not configured" rather than an explicit zero. For pure scoring-math purposes, treating an absent key as contributing zero points is safe and standard. That equivalence should not be extended to every purpose, however: "absent" and "explicitly configured to zero" are different facts about how a commissioner set up the league, even though they compute identically. A feature that displays or diffs a league's scoring configuration to a user needs to preserve that distinction rather than silently collapsing it during ingestion.

### Roster Positions

`roster_positions` is an ordered array of lineup slot labels — for example `QB`, `RB`, `WR`, `TE`, `FLEX`, `SUPER_FLEX`, `REC_FLEX`, `K`, `DEF`, `BN`, `IR`, and `TAXI`. This array is not limited to the starting lineup: bench, injured-reserve, and taxi-squad slots are represented in the same list alongside starting slots, distinguished only by which labels they use, not by a separate "starting vs. bench" flag. The count and ordering of entries in this array is what ultimately defines a roster's total size and starting requirements everywhere else in the API — a roster's `starters` array elsewhere is only interpretable in light of this list, since it is what assigns positional meaning to each index. A minority of sources describe bench/IR/taxi capacity as living only in `settings` (as counts) with `roster_positions` limited to startable slots; the corroborated majority view — and the view consistent with a direct read of live league responses — is that `BN`, `IR`, and `TAXI` labels appear directly as entries in `roster_positions` itself, and this page follows that majority.

### Fields Whose Meaning Is Thinly Documented

A handful of fields appear on league objects in some contexts without a well-established public meaning — for example `shard` (apparently an internal routing hint) and `last_read_id` (apparently a user-contextual read-marker in some response contexts). These should be preserved when present but not relied upon for any product logic until their behavior is independently confirmed; they are the kind of field most likely to be an internal implementation detail rather than a stable public contract.

---

## Key Decisions

- **Decision:** The platform will fetch and cache the league object (`settings`, `scoring_settings`, `roster_positions`) once per league on sync, refreshing on an explicit trigger — a user-initiated refresh or a scheduled low-frequency check — rather than polling it alongside every roster or matchup fetch.
  **Reasoning:** League configuration changes are rare mid-season — commissioner edits, not routine weekly events — so treating it as a slow-changing resource avoids wasted request volume against data that essentially never changes between waiver runs.
  **Rejected alternative:** Refetching the league object on every roster or matchup call was rejected as unnecessary request overhead for data that changes on the order of weeks or months, not minutes.

- **Decision:** The platform will store `scoring_settings` as a raw key-value map exactly as returned, with a separate computed step that treats absent keys as zero only at the moment fantasy points are calculated — never overwriting the raw stored map with zero-filled defaults.
  **Reasoning:** Preserving the distinction between "not configured" and "explicitly zero" is required to accurately show a commissioner their league's actual scoring configuration, even though the two are computationally equivalent for scoring math.
  **Rejected alternative:** Normalizing every known scoring key to an explicit value (defaulting unset keys to 0) at ingestion time was rejected because it would permanently erase the distinction between an unconfigured stat and one a commissioner deliberately zeroed out.

- **Decision:** The platform will parse `settings` as an open, schema-tolerant map — surfacing a fixed set of recognized fields in the UI while retaining any unrecognized keys in storage rather than dropping them.
  **Reasoning:** New settings keys have historically appeared without a version bump or migration notice; a strict, hard-coded schema would silently lose newly introduced configuration for leagues using a newer format.
  **Rejected alternative:** Defining a strict settings schema and discarding unrecognized fields at ingestion was rejected because it would make the platform blind to new league features the moment Sleeper adds them, with no error signal to indicate data was lost.

- **Decision:** The platform will key dynasty/keeper league history by walking the `previous_league_id` chain explicitly, and will never treat a single `league_id` as a stable identifier for a league across multiple seasons.
  **Reasoning:** Season renewal issues a brand-new `league_id`; caching or foreign-keying platform data against a single `league_id` for a multi-season league would silently break at every renewal.
  **Rejected alternative:** Treating `league_id` as a durable, season-independent key was rejected outright — it does not hold across renewals, and the failure mode (silently orphaned history) is difficult for a user to detect after the fact.

---

## Open Questions

- [ ] Is there a complete, authoritative list of every `scoring_settings` key Sleeper supports across all league formats and eras (redraft, dynasty, best-ball, IDP)? — needs either direct confirmation from Sleeper or systematic sampling across a large number of real leagues, since available sources only describe a commonly observed partial set, and no source publishes a formal schema for this object.
- [ ] How reliably does the `previous_league_id` chain hold across multi-season dynasty leagues in practice, and how often is it broken by league recreation or commissioner resets? — needs empirical sampling across real long-running dynasty leagues once the platform has ingestion volume to check against.
- [ ] What do the thinly documented fields `shard` and `last_read_id` actually control, and are they safe to ignore entirely for a read-only integration? — needs direct observation across a range of league states, since no source describes their behavior with confidence.
- [ ] Does `roster_positions` ever exclude `BN`/`IR`/`TAXI` entries for any league type, with bench/reserve capacity instead expressed only as a count in `settings`? — a minority of sources describe this alternate shape; needs direct sampling against live league responses to confirm the majority view holds universally.
