---
title: "Sleeper Undocumented Projections Endpoint and Per-Format ADP Fields"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-22"
confidence: medium
tags:
  - adp
  - undocumented-endpoint
  - endpoint-structure
  - rest-api
  - read-only-api
  - player-id-mapping
  - caching-strategy
related:
  - sleeper-api/players-endpoint
  - sleeper-api/authentication
  - league-mechanics/average-draft-position
---

## Summary

Sleeper operates an undocumented projections surface at `api.sleeper.com/projections/nfl/{year}` that carries per-format average draft position (ADP) fields — `adp_ppr`, `adp_half_ppr`, `adp_std`, `adp_2qb`, plus dynasty, IDP, and rookie variants — inside each player's projection record, identified by the native Sleeper `player_id` and requiring no authentication or API key. This endpoint is the platform's decided ADP source of record (decision of record 2026-07-22), chosen because it is the only evaluated source natively keyed by the platform's canonical player identity with zero identity-mapping cost. It is genuinely undocumented — absent from Sleeper's official documentation and even from the community's undocumented-endpoint canon — and it lives on a different host (`api.sleeper.com`) than the documented read API (`api.sleeper.app/v1`), so every consumer must treat it as a surface that can change shape, move, or vanish without notice: isolate its failures, preserve the last good snapshot, and never let it take down features built on the documented API.

---

## Core Knowledge

### Documentation Status and Provenance

No official Sleeper documentation covers this endpoint. A full inventory of Sleeper's documented API (17 documented endpoints as of 2026-07-22) contains no ADP or projections endpoint of any kind, and the community's principal undocumented-endpoint reference does not list it either — it only gestures at undocumented stats/projections surfaces existing on the `api.sleeper.com` host. Knowledge of this endpoint's existence, shape, and behavior therefore rests entirely on direct live verification: it was manually tested and confirmed working on 2026-07-22, twice in the same day by two independent sessions, with identical results on the sampled record (Bijan Robinson, `player_id` `"9509"`, `adp_ppr` 1.4 on both pulls). Everything on this page describes observed behavior as of that date, not a published contract. There is no versioning, no changelog, no deprecation policy, and no support channel — the endpoint could change field names, restructure its response, or disappear entirely with zero notice, and no one outside Sleeper would be warned.

### The Host Split: api.sleeper.com Is Not api.sleeper.app/v1

This endpoint lives on `api.sleeper.com`. The documented Sleeper read API — the one covered by every other page in this category, the one with the no-auth access model, the documented once-daily players-dump rule, and the ~1,000 requests/minute guidance — lives on `api.sleeper.app/v1`. These are two different hosts, and the distinction is load-bearing in both directions:

- An existing integration client pinned to the documented `api.sleeper.app/v1` base URL cannot reach this endpoint by path alone. Consuming it requires deliberately targeting the other host — it is not a new path on the known API, it is a different surface.
- Nothing established about the documented host transfers automatically. The rate-limit figures, throttling behavior, and operational guidance corroborated for `api.sleeper.app/v1` were observed and documented against that host; whether `api.sleeper.com` shares the same infrastructure, limits, or enforcement is unknown. A consumer should extend the same politeness disciplines (modest request volume, request pacing, caching) without assuming the documented ceilings apply.

What the two hosts do share, per live verification: no authentication of any kind. The projections endpoint returns full data to a bare, credential-free request, exactly like the documented read API.

### Endpoint Structure and Query Parameters

The verified request form is `api.sleeper.com/projections/nfl/{year}` with three query parameters observed working together: `season_type=regular`, a repeatable array-style position filter (`position[]=RB`, repeatable for multiple positions), and `order_by` naming a field to sort by (for example `order_by=adp_ppr` or `order_by=adp_half_ppr`). With `order_by` set to an ADP field, results return sorted ascending by that field — best (earliest) draft position first — which makes a single request per format a natural "top of the draft board" pull. The `{year}` segment takes the season year; 2026 data was live and populated in July 2026, well before the season.

Only this parameter combination is verified. Behavior without a `position[]` filter, behavior with an invalid or future year, whether pagination or a result cap exists, whether `season_type` accepts other values here, and whether weekly (rather than season-level) variants of this surface exist are all unverified — a consumer should not assume any of them without testing.

### Response Shape

The response is a JSON array of projection objects — not a map keyed by player ID (unlike the documented players dump, which returns an ID-keyed object). Each element in the array is one player's season-level projection record. The record identifies its player via a top-level `player_id` field carrying the native Sleeper canonical player ID as a string. This is the same ID space used by rosters, drafts, matchups, and the players dump, which means ADP data from this endpoint joins to everything else in the platform with no identity mapping, no crosswalk, and no name-based matching at all — the single most valuable structural property of this source.

Observed top-level fields per record: `player_id` (native Sleeper ID, string), `season` (string, e.g. `"2026"`), `season_type` (`"regular"`), `sport` (`"nfl"`), `week` (null for season-level records), `game_id` (`"season"` for season-level records), `category` (`"proj"`), `last_modified` and `updated_at` (epoch-millisecond timestamps; sampled records carried same-day timestamps, suggesting the data refreshes at least daily during the offseason, though no cadence is promised), `company` (observed as `"rotowire"` — see the provenance caveat below), `team` (NFL team abbreviation), `opponent` (null for season-level records), an embedded `player` object, and a `stats` object.

The embedded `player` object carries convenience metadata: `first_name`, `last_name`, `position`, `fantasy_positions` (array), `team`, injury fields (`injury_status`, `injury_body_part`, `injury_notes`, `injury_start_date`), `years_exp`, `news_updated`, and a `metadata` sub-object. This duplicates information owned by the players dump; it is useful for spot-checking a response by eye but should not replace the platform's own player table as the identity and metadata source — the players dump remains canonical for player attributes.

### The stats Object: Projections and ADP Ride Together

The `stats` object is a flat map mixing two kinds of data: projected season statistics (projected points in each default scoring format such as `pts_ppr`, `pts_half_ppr`, `pts_std`, plus component stats like rushing attempts, rushing yards, receptions, receiving yards, touchdowns, and first downs) and the ADP fields. The ADP fields are not a separate section or object — they are keys inside `stats` alongside the projection stats, and a consumer extracts them by key name.

Twelve ADP fields were observed live on 2026-07-22:

- Redraft, by scoring format: `adp_ppr`, `adp_half_ppr`, `adp_std`, `adp_2qb`
- Dynasty, by scoring format: `adp_dynasty`, `adp_dynasty_ppr`, `adp_dynasty_half_ppr`, `adp_dynasty_std`, `adp_dynasty_2qb`
- IDP: `adp_idp`, `adp_idp_1qb`
- Rookie drafts: `adp_rookie`

Values are decimal draft-slot numbers (for example, `adp_ppr` 1.4 means the player is drafted, on average, between the first and second overall pick in PPR formats). The per-format field structure aligns directly with the established analytical rule that ADP is only valid within the population and format that generated it — this endpoint hands the consumer format-matched numbers rather than one contaminated blend, which is a genuine structural advantage over single-number ADP sources.

Two field-inventory cautions. First, this inventory must be treated as open, not closed: the two same-day verifications each recorded slightly different inventories (the first missed `adp_dynasty_2qb`, which the second confirmed live), demonstrating directly that casual observation under-counts the field set and that additional format variants may exist or appear later. Ingestion should capture ADP fields by pattern and preserve unrecognized ones rather than hardcoding a closed list. Second, per broader Sleeper behavior, field presence should never be assumed uniform across all records — parse permissively and tolerate absent keys.

### The 999.0 Sentinel

Sampled veteran players carried the value `999.0` in `adp_rookie` (a format they are ineligible for) and in the bare `adp_dynasty` field — while the format-suffixed dynasty fields on the same records (`adp_dynasty_ppr`, `adp_dynasty_half_ppr`, `adp_dynasty_std`) carried small, realistic values. The consistent pattern across every sampled record is that `999.0` functions as a "no ADP in this format" sentinel, not a real draft position. This is an inference from observation, not documented behavior, but the defensive rule it implies is unambiguous: never ingest `999.0` (or any implausibly large slot value) as a real ADP. A raw 999 merely sorts a player last if displayed, but it actively poisons anything computed downstream — averages, format-fallback logic, or "value vs. ADP" deltas would all silently corrupt. The parallel observation that bare `adp_dynasty` reads 999.0 while its suffixed variants are populated also suggests the unsuffixed field may be vestigial; consumers should prefer the format-suffixed dynasty fields.

### What This Endpoint Does Not Provide

The ADP values are point estimates only. There is no dispersion metadata of any kind: no standard deviation, no high/low pick range, no times-drafted count, no sample size, and no population parameters (which league sizes were sampled, what date window the average covers, how many drafts contributed, or whether the population is filtered in any way). This matters because established ADP methodology treats dispersion as a first-class signal — the mean alone cannot answer "how likely is this player to still be available at my next pick," and the platform's standing ADP guidance calls for surfacing dispersion wherever the underlying data supports it. Here the underlying data does not support it, and that limitation was explicitly accepted as part of the source decision. The platform must not fabricate, estimate, or borrow dispersion figures from another source's population to fill the gap, because a dispersion number from a different drafting population attached to this source's mean would be precisely the cross-population contamination the ADP methodology warns against.

### ADP Provenance Caveat

Each projection record carries a `company` field observed as `"rotowire"`, indicating the projected statistics come from a third-party projections vendor. Whether the ADP fields embedded in the same `stats` object are Sleeper's own draft-room market data (the natural presumption, and part of the population-matching rationale for choosing this source) or are also vendor-supplied is not confirmed by anything observable in the response. This distinction matters: the source-selection rationale valued this endpoint partly as population-matched to the platform where the connected league actually drafts, and that rationale is strongest if the ADP reflects real Sleeper draft rooms. The presumption is plausible — per-format Sleeper-style ADP fields keyed by native Sleeper IDs are most simply explained as Sleeper's own aggregation — but it is unverified and is recorded as an open question rather than a settled fact.

### Fragility Model and Required Defensive Posture

The correct mental model for this endpoint is the same one the platform applies to its most fragile external dependency, not the one it applies to the documented Sleeper read API. The documented Sleeper API has a years-stable public contract; this endpoint has no contract at all. Concretely, every consumer must assume: the response shape can change without notice; field names can be renamed or dropped; the host or path can move; the data can go stale silently; and the entire surface can vanish — potentially at the worst possible moment, mid-draft-season, since there is no notice period.

The required posture has three legs. First, isolation: a failure of this endpoint (network error, shape change, empty response, nonsense values) must be contained to the ADP feature itself and must never cascade into any feature built on the documented API — the same fault-isolation standard the platform applies to its cookie-authenticated ESPN integration. Second, last-good-snapshot preservation: every successful, validated fetch is retained as a durable snapshot, and a failed or implausible fetch never overwrites the last good one — validation before swap, never in-place destruction. Draft preparation must remain fully functional on the most recent good snapshot even if the endpoint disappears outright, because a days-old ADP snapshot is still overwhelmingly useful for a draft while a wiped table is not. Third, permissive parsing: unrecognized fields are preserved rather than rejected, expected fields are tolerated when absent, and plausibility checks (response is an array, records carry `player_id`, ADP values fall in a sane range, record count is in line with recent history) gate acceptance of a new snapshot.

### Decision Provenance and Source of Record

Sleeper's undocumented projections endpoint was selected as the platform's ADP source on 2026-07-22 — Nick's decision of record, recorded on the Wave 3a item in `.claude/MANUAL_SETUP_CHECKLIST.md`, following live verification of this endpoint and evaluation of the alternatives that same day. This wiki page is the source of record for the endpoint's shape, field inventory, and required posture; the checklist item records the decision itself and its constraints. Alternatives evaluated and passed over: FantasyFootballCalculator (free, no key, and notably richer metadata — standard deviation, high/low, times-drafted, sample size, date window, league-size parameter — but keyed by proprietary player IDs resolvable only through name-based matching, the established last-resort join and a known silent-corruption risk); FantasyPros (API-key-gated behind a paid membership tier, with FantasyPros-proprietary player IDs requiring an additional mapping layer). Rejected outright on methodology grounds: Underdog ADP (a best-ball market, non-transferable to managed redraft) and ESPN ADP (an autodraft/default-ranking-contaminated population on a fragile integration surface).

---

## Key Decisions

- **Decision:** The platform will use this endpoint — `api.sleeper.com/projections/nfl/{year}` with `season_type`, `position[]`, and `order_by` parameters — as its sole ADP source of record, extracting the per-format `adp_*` fields keyed by native Sleeper `player_id` (decision of record 2026-07-22, recorded in `.claude/MANUAL_SETUP_CHECKLIST.md`, Wave 3a).
  **Reasoning:** It is the only evaluated source natively keyed by the platform's canonical player identity — zero identity mapping, zero name-based joins — and it provides format-matched ADP (PPR, half-PPR, standard, 2QB, dynasty variants) rather than a single blended number, at zero cost with no credential to manage. It is also plausibly population-matched to the platform the connected league actually drafts on.
  **Rejected alternatives:** FantasyFootballCalculator was passed over despite richer dispersion metadata because its proprietary IDs force name-based player matching, the established silent-corruption join of last resort. FantasyPros was passed over as key-gated behind a paid tier with its own proprietary ID space. Underdog ADP was rejected because best-ball ADP is non-transferable to managed redraft. ESPN ADP was rejected as an autodraft-contaminated population on a fragile integration.

- **Decision:** The platform will treat this endpoint with full defensive isolation — the same fault-containment standard applied to the ESPN integration — so that any failure or shape change here degrades only the ADP feature and can never take down features built on the documented Sleeper API.
  **Reasoning:** The endpoint is undocumented with no contract, no stability guarantee, and no notice period for changes; coupling it to documented-API features would let the platform's least reliable dependency break its most reliable ones.
  **Rejected alternative:** Treating it as a first-class Sleeper surface alongside the documented endpoints was rejected — shared code paths and shared failure handling would propagate exactly the breakage the host and documentation split warns about.

- **Decision:** The platform will preserve a last-good ADP snapshot: every accepted fetch is validated before it replaces the prior snapshot, a failed or implausible fetch never overwrites good data, and draft features run from the most recent good snapshot regardless of the endpoint's current availability.
  **Reasoning:** The endpoint can vanish or break without warning, including mid-draft-season; a days-old ADP snapshot remains highly useful for draft preparation, while a wiped or corrupted table is a total feature loss. This mirrors the platform's established validate-before-swap caching architecture for the players dump.
  **Rejected alternative:** In-place overwrite on every fetch was rejected — it converts any single bad response into permanent data loss at exactly the moment the data matters most.

- **Decision:** The platform will target `api.sleeper.com` explicitly and separately for this endpoint, leaving the existing documented-API client pinned to `api.sleeper.app/v1` untouched, without building a generalized multi-host Sleeper abstraction.
  **Reasoning:** These are two different surfaces with different reliability characteristics; keeping them separate keeps the fragile one quarantined and the stable one simple. A speculative host-abstraction layer would violate the platform's standing rule against building for hypothetical surfaces.
  **Rejected alternative:** Re-pointing or parameterizing the existing documented client to serve both hosts was rejected — it would entangle the undocumented surface's failure modes and future churn with the client every stable feature depends on.

- **Decision:** The platform will treat `999.0` (and any implausibly large slot value) in any `adp_*` field as "no ADP in this format" — a null, never a real value — and will prefer the format-suffixed dynasty fields over the bare `adp_dynasty` field.
  **Reasoning:** Live observation consistently shows 999.0 in format-inapplicable fields (rookie ADP on veterans, the bare dynasty field) while suffixed variants carry real values; ingesting the sentinel as data would silently corrupt averages, comparisons, and value-versus-ADP calculations downstream.
  **Rejected alternative:** Ingesting raw values unfiltered and handling outliers at display time was rejected — display-layer filtering leaves every computed consumer of the stored data poisoned.

- **Decision:** The platform will ingest ADP fields by pattern with a permissive parser — preserving unrecognized `adp_*` variants, tolerating absent fields, and gating snapshot acceptance on structural plausibility checks — rather than validating against a closed field list.
  **Reasoning:** The field inventory is demonstrably open (a twelfth field surfaced only on the second same-day verification), the surface is undocumented, and Sleeper's broader pattern is fields appearing without notice; a strict parser would break on exactly the kind of change this source is most likely to undergo.
  **Rejected alternative:** Hardcoding the twelve observed fields as an exhaustive schema was rejected — it converts benign additive change into ingestion failure.

- **Decision:** The platform will present ADP from this source as point values with explicit format context, will not fabricate or borrow dispersion metadata to fill the endpoint's gap, and will omit or separately source any feature that genuinely requires dispersion.
  **Reasoning:** The endpoint provides no standard deviation, range, or sample-size data, and attaching dispersion from a different source's drafting population to this source's means would be cross-population contamination — a worse analytical error than displaying an honest point estimate. Accepting the gap was an explicit part of the source decision.
  **Rejected alternative:** Backfilling dispersion from FantasyFootballCalculator's metadata was rejected — its population is not the population that generated these means, and blending them would misrepresent both.

---

## Open Questions

- [ ] Are the `adp_*` values Sleeper's own draft-room market data, or supplied by a vendor along with the projections (each record carries `company: "rotowire"`)? — the population-matching rationale for this source is strongest if the ADP is Sleeper-native; needs external confirmation or comparison of these values against observed Sleeper draft behavior.
- [ ] What population generates the ADP — which league sizes, what sampling window, how many drafts, any filtering — is entirely unpublished; accepted as unknowable for now, but worth revisiting if Sleeper ever documents the surface.
- [ ] What is the actual update cadence? Sampled records carried same-day `last_modified` timestamps in July, suggesting at-least-daily refresh in the offseason, but no cadence is promised and in-season behavior is unobserved — measurable empirically from timestamp drift across scheduled fetches.
- [ ] Is the observed 999.0 sentinel semantics ("no ADP in this format") complete and stable — and does the bare `adp_dynasty` field ever carry real values, or is it fully superseded by the format-suffixed variants? — inferred from consistent observation, not documentation; needs broader sampling across positions and player types.
- [ ] Is the twelve-field ADP inventory complete, and do additional format variants exist or appear seasonally (the field set demonstrably under-counts on casual observation)? — needs periodic re-sampling, and pattern-based ingestion hedges against the answer being no.
- [ ] What are the unverified request behaviors: omitting `position[]`, other `season_type` values, invalid years, result caps or pagination, and whether weekly (per-`week`/`game_id`) projection variants exist on this surface? — needs direct testing before any feature depends on them.
- [ ] Does `api.sleeper.com` share rate-limit infrastructure and thresholds with the documented `api.sleeper.app/v1` host? — no evidence either way; the platform extends the same request-pacing discipline without assuming the documented ceilings apply.
