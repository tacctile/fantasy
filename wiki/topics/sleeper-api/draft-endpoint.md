---
title: "Sleeper Draft Endpoint Structure"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - ownership-model
  - player-id-mapping
  - undocumented-endpoint
related:
  - sleeper-api/roster-endpoint
  - sleeper-api/league-endpoint
---

## Summary

Sleeper exposes drafts across three endpoints — `GET /league/{league_id}/drafts` (a league can have more than one draft, especially in dynasty), `GET /draft/{draft_id}` (configuration, format, and the slot-to-roster mapping), and `GET /draft/{draft_id}/picks` (the ordered selection log) — and a league's `slot_to_roster_id` map is the authoritative bridge from draft board position to the roster that actually receives each pick. On individual picks, `roster_id` is the field that reflects true ownership including in-draft pick trades; `draft_slot` is the original board column and `picked_by` is only the human who clicked, and none of the three should be treated as interchangeable. Pick `metadata` is a point-in-time snapshot of the player at draft time and goes stale immediately for any current-state use.

---

## Core Knowledge

### Three Endpoints, Three Layers

`GET /league/{league_id}/drafts` returns an array of draft objects associated with the league — not a single draft. `GET /draft/{draft_id}` returns the detailed object for one specific draft: format, settings, status, and the slot/roster mappings. `GET /draft/{draft_id}/picks` returns the ordered array of completed selections for that draft. These three layers answer different questions — which drafts exist, how a specific draft is configured, and what was actually picked — and a complete draft-history feature needs to walk all three rather than assuming the top-level league object's single `draft_id` field is exhaustive.

### A League Can Have More Than One Draft

Dynasty leagues in particular commonly carry a startup draft plus one or more later rookie or supplemental drafts, and Sleeper never deletes a draft object once created — aborted or restarted drafts persist alongside the one that actually ran. Blindly taking the first element of the drafts array, or trusting the league object's single `draft_id` field, can silently select an abandoned or superseded draft instead of the intended one. The correct approach is to filter by `season`, `type`, and `status`, preferring `status = complete` for any historical analysis, rather than assuming array order or a single ID field is meaningful on its own.

### Draft Object Fields

A draft object carries `draft_id`, `league_id`, `season`, `sport`, `type` (`snake`, `linear`, or `auction`), and `status` (values observed include `pre_draft`, `drafting`, `paused`, and `complete`). Its `settings` object carries `teams`, `rounds`, `pick_timer`, per-position slot counts, a `budget` field specific to auction drafts, and a `reversal_round` setting controlling third-round-reversal-style order flips when non-zero. Its `metadata` carries descriptive fields like scoring type and draft name, and is not a rigid schema — treat it as semi-structured. Two mapping fields matter more than any other on this object: `draft_order`, a map of `user_id` to draft slot (absent or null before the order is set, and incomplete for orphaned or unclaimed teams), and `slot_to_roster_id`, a map of draft slot to `roster_id`. Between the two, `slot_to_roster_id` is the more reliable and more generally useful mapping, since draft slots ultimately belong to rosters — the entities everything else in the API keys on — not to user display identities that can be incomplete or reassigned.

### Pick Object Fields

Each element of the picks array carries `pick_no` (the overall, 1-indexed pick number across the whole draft), `round`, `draft_slot` (the original board column associated with the pick), `roster_id` (the roster that actually receives the player, reflecting any in-draft pick trades), `picked_by` (the `user_id` of whoever physically made the selection — commonly an empty string for autopicks, commissioner-entered picks, or unclaimed slots), `player_id`, `is_keeper` (a boolean, though null or absent in many non-keeper contexts rather than a reliable explicit `false`), and `metadata` — a denormalized snapshot of the player at the moment of the pick, including name, position, team, and status, plus a string-typed `amount` field on auction picks representing the winning bid.

### roster_id Is the Ownership Field — Not draft_slot, Not picked_by

This is the single most consequential distinction on this endpoint. `draft_slot` is the pick's original structural position on the board and does not change even when the pick itself is traded. `picked_by` identifies the human who executed the selection, which can diverge from the team that actually owns the pick's outcome — a co-manager, a commissioner making a pick on someone's behalf, or an autopick can all produce a `picked_by` value unrelated to strategic ownership. `roster_id` is the field that reflects the actual current owner of the pick at the time it was made, including the effect of any traded-pick history. Any feature answering "which fantasy team acquired this player" must use `roster_id`; using `draft_slot` or `picked_by` for that purpose is a well-corroborated, common failure pattern that silently misattributes picks in any league with traded draft capital.

### Traded Picks Require a Separate Endpoint for Full Lineage

A completed pick's `roster_id` correctly reflects who owned that pick when it was made, but reconstructing the full trade lineage behind that — which roster originally held the slot, and through how many trades it passed before draft day — requires the dedicated traded-picks resource (in-draft trade movement) plus the league-level future-picks trade resource for picks traded across seasons before a draft has even occurred. Neither the draft object nor the picks array alone provides complete historical asset-ownership lineage; dynasty draft-capital accounting needs to combine pick-level `roster_id` with these dedicated trade resources.

### Snake Draft Math Is a Fallback, Never a Substitute for Sleeper's Own Fields

For an ordinary snake draft with no reversal, round and slot combine into an overall pick number by standard alternating-order arithmetic, and this formula is useful for sanity-checking data. It should never be used to compute or override values Sleeper already provides directly on each pick (`pick_no`, `round`, `draft_slot`), because several common real-world conditions break the naive formula: third-round reversal (a `reversal_round` setting that flips snake order again partway through, common in dynasty startups), keeper picks interleaved at commissioner-designated positions, in-draft pick trades, and manually paused or edited draft boards. Trust Sleeper's reported per-pick fields as ground truth and treat any independently computed slot arithmetic as a validation check, not a data source.

### Auction Drafts Use a Materially Different Value Signal

Auction drafts populate the same top-level pick fields as snake or linear drafts, but `round`, `draft_slot`, and `pick_no` in an auction reflect nomination order, not draft value — the meaningful cost signal is exclusively `metadata.amount`, the winning bid, which arrives as a string and needs explicit numeric coercion before any budget or valuation math. Budget context for the draft as a whole comes from the draft object's `settings.budget`. Any tooling built primarily around snake-draft assumptions (treating `draft_slot` as a proxy for value, or ignoring `metadata.amount` entirely) will silently drop the only meaningful cost data an auction draft provides.

### Pick Metadata Is a Point-in-Time Snapshot, Not Current Player Data

`metadata` on a pick object reflects the player's attributes — team, status, name — as they stood at the moment the pick was made, not as they stand now. A player's NFL team, injury status, or even name can change after the draft, and the pick's `metadata` does not update to reflect that. Any feature reasoning about a player's current state must join `player_id` to the live player directory rather than trusting pick metadata for anything beyond historical, draft-day display context.

---

## Key Decisions

- **Decision:** The platform will select a league's relevant draft by filtering the drafts array on `season`, `type`, and `status = complete` for historical analysis, rather than assuming the league object's `draft_id` or the first array element is the correct one.
  **Reasoning:** Leagues — especially dynasty leagues — can carry multiple drafts including abandoned or restarted ones that are never deleted, and blind selection risks silently analyzing the wrong draft.
  **Rejected alternative:** Trusting the league object's single `draft_id` field as exhaustive was rejected — it points to one associated draft, not a league's complete draft history.

- **Decision:** The platform will use pick-level `roster_id` as the sole field for answering "which team acquired this player," and will store `draft_slot` and `picked_by` as separate, clearly-labeled dimensions rather than treating any of the three as interchangeable.
  **Reasoning:** This is the most consequential and best-corroborated distinction on the endpoint — `draft_slot` is structural, `picked_by` is human-attribution, and only `roster_id` reflects actual current team ownership including trades; conflating them is a common, well-documented failure pattern.
  **Rejected alternative:** Using `draft_slot` for team attribution was rejected outright — it does not update when a pick is traded, and would misattribute every traded pick to its original slot-holder instead of its actual recipient.

- **Decision:** The platform will combine pick-level `roster_id` with the dedicated in-draft and cross-season traded-picks resources for any feature that needs full draft-capital lineage, rather than treating a completed pick's `roster_id` alone as sufficient history.
  **Reasoning:** A pick's final `roster_id` tells you who ended up with it, not the chain of trades that got it there; dynasty draft-capital accounting genuinely needs both layers.
  **Rejected alternative:** Relying on picks data alone for trade-value or draft-capital tracking was rejected — it answers "who drafted this player" but not "how many trades did this asset pass through," which dynasty-focused features require.

- **Decision:** The platform will treat Sleeper's own `pick_no`, `round`, and `draft_slot` fields as ground truth for draft order, using standard snake-draft arithmetic only as an internal validation check, never as a substitute when those fields are directly available.
  **Reasoning:** Third-round reversal, keeper interleaving, in-draft trades, and paused/edited boards all invalidate naive formula-based ordering; Sleeper's reported per-pick fields already account for all of these correctly.
  **Rejected alternative:** Computing draft order independently from round/team-count arithmetic was rejected as the primary source — it silently produces wrong results the moment any of the above conditions applies, which is common in real dynasty leagues.

- **Decision:** The platform will treat auction-draft picks as a distinct value model keyed on `metadata.amount` (explicitly coerced from string to numeric), rather than reusing snake-draft assumptions about `draft_slot` or `pick_no` as value signals.
  **Reasoning:** Auction `round`/`draft_slot`/`pick_no` reflect nomination order, not price; `metadata.amount` is the only field carrying the actual cost signal, and treating it as an afterthought would silently drop the most important data auction drafts provide.
  **Rejected alternative:** Applying the same valuation logic used for snake/linear drafts to auction drafts was rejected — it would ignore price entirely and substitute a meaningless nomination-order signal instead.

---

## Open Questions

- [ ] What is `picked_by`'s exact behavior when a commissioner makes a pick on behalf of a claimed (not orphaned) team — does it record the commissioner's `user_id` or the team owner's? — needs direct observation of a commissioner-assisted pick in a live league, since available sources describe the field's general unreliability for ownership but not this specific scenario with precision.
- [ ] Is `is_keeper` reliably distinguishable between "confirmed not a keeper" and "keeper concept not applicable/not populated" across all historical drafts, or does null vs. false vary inconsistently by league and season? — needs sampling across a range of keeper and non-keeper leagues, since sources note the inconsistency without resolving it.
- [ ] Does the league-level traded-picks resource and the draft-level in-draft traded-picks resource ever disagree for a pick traded both before and during a draft, and if so which is authoritative? — needs direct testing against a league with both cross-season and in-draft pick trades, since no source addresses this composition scenario directly.
