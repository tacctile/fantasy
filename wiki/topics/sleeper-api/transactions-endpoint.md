---
title: "Sleeper Transactions Endpoint Structure"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - faab
  - waiver-wire
  - ownership-model
  - player-id-mapping
  - undocumented-endpoint
related:
  - sleeper-api/roster-endpoint
  - sleeper-api/users-endpoint
  - sleeper-api/league-endpoint
  - sleeper-api/draft-endpoint
---

## Summary

`GET /league/{league_id}/transactions/{round}` returns every transaction processed in a single league week — waiver claims, free-agent moves, and trades commingled in one array, with `round` meaning the week number, not a page index or draft round. There is no all-season endpoint, so a complete history requires iterating every week and deduplicating on `transaction_id`. The `type` field (`waiver`, `free_agent`, or `trade`) is the only reliable classification signal, but actual asset movement is represented uniformly across all three types through `adds`, `drops`, `draft_picks`, and `waiver_budget` — not through type-specific structures. The single most consequential integration mistake is aggregating activity without filtering on `status`: failed waiver claims are returned right alongside completed ones, and a naive count of "adds this week" silently includes claims that never actually happened.

---

## Core Knowledge

### Core Mechanics and the Weekly Grain

The endpoint takes a single required path segment, `round`, which is the league's transaction week — for football, this lines up with the NFL week (1 through 17 or 18 depending on season length, plus playoff weeks). There is no bulk "all transactions" call and no documented pagination; a full-season transaction ledger is built by the caller, one request per week, concatenated and deduplicated. Pre-Week-1 and off-season activity is sometimes retrievable under low-numbered rounds, but this coverage is inconsistent and undocumented — treat it as unreliable rather than building a hard dependency on it.

Every transaction object shares a common envelope regardless of type: `transaction_id` (a snowflake-style string, time-sortable), `type`, `status`, `status_updated` and `created` (millisecond epoch timestamps), `leg` (the week the transaction belongs to, generally matching `round`), `roster_ids` (every roster involved), `creator` (the initiating `user_id`), `consenter_ids` (roster IDs that agreed to the transaction), `adds`, `drops`, `draft_picks`, `waiver_budget`, `settings`, and `metadata`.

### The Three Transaction Types and How They're Differentiated

`type` is the primary and only fully reliable discriminator: `"waiver"` is a claim that went through waiver processing (priority or FAAB); `"free_agent"` is an immediate add/drop outside the waiver window, typically for a player who has already cleared waivers; `"trade"` is a roster-to-roster exchange with two or more entries in `roster_ids`. The same underlying manager action can produce a different `type` depending purely on timing — re-adding a player who was just dropped often shows as `"waiver"` because a dropped player re-enters the waiver period, not because the manager did anything resembling a waiver claim conceptually. Do not attempt to infer transaction type from the presence or count of `roster_ids`, `adds`, or `drops` alone; a trade is not reliably identifiable just because more than one roster appears, and a waiver is not reliably identifiable just because a bid amount happens to be present.

### Asset Movement Is Uniform Across Types

Regardless of `type`, the actual movement of assets is always expressed through the same four fields, and parsing logic should branch on `type` only for FAAB-bid interpretation and failure handling — never for asset extraction. `adds` and `drops` are maps of `player_id` to `roster_id`: a key in `adds` means that roster received that player; a key in `drops` means that roster gave it up. Both are `null` (not an empty object) when there is nothing to report, and code that assumes an object will always be present breaks on this distinction. `draft_picks` is an array populated only on trades that move future draft capital, with each entry carrying `season`, `round` (a genuine draft round, distinct from the URL's `round` week parameter), `roster_id` (the pick's original owner), `previous_owner_id` (holder immediately before this trade), and `owner_id` (the new holder after this trade). `waiver_budget` is an array populated only on trades that move FAAB dollars, with `sender`, `receiver`, and `amount` entries. A trade can combine player movement, pick movement, and FAAB movement in a single transaction object, and all three channels are independently nullable — a pick-only or FAAB-only trade has `adds`/`drops` as `null`, which breaks any pipeline keyed purely on player movement.

### Failed Waiver Claims Pollute Naive Aggregates

`status` is `"complete"` or `"failed"` (trades can additionally sit as `"pending"` during a review window before resolving to complete, declined, or cancelled). Failed transactions are returned by the endpoint, not filtered out — this is most common on waiver claims that lost a priority or FAAB tiebreaker, and every losing claim on a contested player is returned as its own transaction object alongside the winning one. This is analytically valuable for reconstructing the full bid market on a player, but it means any "adds per week" or "FAAB spent" aggregate that doesn't explicitly filter to `status == "complete"` will overcount, sometimes substantially in leagues with heavy waiver competition. `metadata` occasionally carries a notes-style explanation for why a claim failed, but this field is inconsistently populated and should be treated as best-effort context, not a field to build logic against.

### FAAB Mechanics: settings.waiver_bid vs. waiver_budget

Two different fields carry FAAB information depending on transaction type, and conflating them is a common error. On a waiver-type transaction, `settings.waiver_bid` is the amount that specific roster bid to win that specific claim — this is a claim attribute. On a trade, `waiver_budget` is the array of FAAB dollars changing hands between rosters as a traded asset — this is an asset-transfer record, structurally unrelated to a waiver bid even though both represent FAAB dollars. `settings` also sometimes carries a `seq` field, community-documented as a waiver-processing sequence index, but its exact semantics are not officially confirmed and should be treated as a secondary, lower-confidence signal rather than something to build core processing-order logic against. Sleeper's FAAB model is winner-pays-full-bid (first-price), not second-price — bid-efficiency analysis should use `settings.waiver_bid` directly with no adjustment.

### Roster IDs vs. User IDs

`adds`, `drops`, and `roster_ids` values are all roster IDs, scoped to the league. `creator` and `consenter_ids` are user IDs (`consenter_ids` on some sources is described as roster IDs for trade consent — treat this as needing confirmation per league, and prefer roster-based consent tracking since trades are fundamentally roster-to-roster events). Bridging a transaction to the human who made it, or to the team that received an asset, requires joining through `/league/{league_id}/rosters` (for `roster_id` → `owner_id`) exactly as described on the roster and users endpoint pages — mixing the roster-ID and user-ID namespaces without that join silently corrupts ownership attribution. Player IDs and team-defense identifiers (which appear as string abbreviations like `"DET"` rather than numeric-style IDs, consistent with their handling on the roster and matchup endpoints) should be treated as opaque strings throughout, never coerced to a numeric type — several Sleeper IDs are large enough that numeric coercion in a language with limited integer precision risks silent truncation.

### Commissioner Actions and Trade Reversals

Commissioner-executed moves (forced adds, forced drops, manual roster fixes) surface as ordinary transactions, most commonly typed `"free_agent"`, with the commissioner's `user_id` as `creator` rather than the affected roster's actual manager — there is no dedicated flag distinguishing a commissioner action from a self-service move, which distorts any manager-activity metric built without awareness of this. A vetoed or reversed trade does not mutate the original transaction's status in a fully corroborated, consistent way across sources; the safer assumption is that a reversal is more likely to surface as a new, separate transaction undoing the asset movement than as an edit to the original object. Treat this as an area to validate empirically per league rather than a settled fact.

### Timing, Status, and the Off-Season Gray Zone

A transaction's `created` and `status_updated` timestamps can diverge meaningfully from when its roster effect actually took hold, particularly for waiver claims that are submitted in one processing window and resolved after a scheduled run. For historical reconstruction, treat creation time, resolution time, and effective roster-change time as three distinct concepts rather than assuming a single timestamp captures all three. Off-season and pre-Week-1 transaction rounds are the least reliable part of this endpoint's coverage and should not be treated as a dependable source for reconstructing preseason roster activity.

---

## Key Decisions

- **Decision:** The platform will treat `type` as a classification field only — governing FAAB-bid interpretation and failure-handling logic — and will derive all actual asset movement uniformly from `adds`, `drops`, `draft_picks`, and `waiver_budget` regardless of type.
  **Reasoning:** All three transaction types share the same underlying asset-movement fields; branching parsing logic on `type` for asset extraction would require redundant code paths that could drift out of sync, when a single uniform extraction already covers every case correctly.
  **Rejected alternative:** Writing type-specific parsers for waiver, free-agent, and trade asset movement was rejected — it duplicates logic that is identical across types and adds a maintenance burden with no corresponding benefit.

- **Decision:** The platform will filter to `status == "complete"` before computing any acquisition count, FAAB-spend total, or roster-history reconstruction, while retaining failed transactions in storage for waiver-market analysis (bid distribution, contested-player demand).
  **Reasoning:** Failed claims are returned by the endpoint and are analytically valuable for market context, but including them in any "what actually happened" aggregate silently inflates every count; the correct handling is to keep both, filtered for different purposes.
  **Rejected alternative:** Discarding failed transactions entirely at ingestion was rejected — it would delete a legitimate signal (revealed demand, bid competitiveness) that has real analytical value for FAAB-strategy features.

- **Decision:** The platform will bridge every `roster_id` appearing in `adds`, `drops`, `roster_ids`, and `draft_picks` to its owning user exclusively through `/league/{league_id}/rosters`, and will never treat `creator` as equivalent to the roster's current owner.
  **Reasoning:** `creator` is a user ID reflecting who initiated the transaction, which is not reliably the same as the roster's owner in commissioner-action and co-managed scenarios; the roster endpoint is the single correct source for ownership resolution, consistent with how ownership is resolved everywhere else in the schema.
  **Rejected alternative:** Treating `creator` as sufficient for attributing a transaction to a roster's manager was rejected — commissioner-executed moves and co-managed rosters make this assumption unreliable in real league data.

- **Decision:** The platform will poll every relevant week's transactions on an ongoing basis, deduplicate strictly on `transaction_id`, and will additionally maintain periodic roster snapshots as an independent backstop rather than relying on replayed transactions alone to reconstruct roster history.
  **Reasoning:** Transaction replay can reconstruct most of a roster's history, but the endpoint has no all-season call, no formal ordering guarantee, and no documented completeness contract; periodic roster snapshots catch anything transaction replay misses or gets wrong.
  **Rejected alternative:** Relying solely on replayed transactions for historical roster reconstruction was rejected — the API's undocumented edge cases (reversals, commissioner edits, off-season gaps) make a single-source reconstruction fragile for a feature with no tolerance for silent drift.

- **Decision:** The platform will store every Sleeper identifier referenced by this endpoint (`transaction_id`, `player_id`, `roster_id`, `creator`) as a string with no numeric coercion step anywhere in the ingestion pipeline, and will explicitly recognize team-defense string IDs during any player-directory lookup.
  **Reasoning:** This is consistent with the platform's existing identifier-handling decision on the authentication and roster endpoint pages; several Sleeper IDs are large snowflake-style numbers that risk silent precision loss if coerced to a numeric type, and defense entries use non-numeric abbreviations that a uniform numeric-ID assumption would mishandle.
  **Rejected alternative:** Coercing IDs to integers where they "look numeric" was rejected for the same reason it was rejected on the roster and authentication pages — the risk of silent corruption on a subset of IDs outweighs any storage convenience.

---

## Open Questions

- [ ] What are the exact semantics of `settings.seq` on waiver transactions, and can it be relied upon to reconstruct processing order within a single waiver run? — needs direct sampling against a live league during an active waiver run, since available sources describe it only as a community-reverse-engineered, unofficial field.
- [ ] Does a vetoed or commissioner-reversed trade mutate the original transaction's `status`, or does it always surface as a new, separate reversing transaction? — sources disagree on the mechanism; needs direct observation of a real trade reversal in a live league.
- [ ] Does the sum of a roster's `settings.waiver_bid` across its complete waiver transactions reliably reconcile with the `waiver_budget_used` field on that roster's object from the roster endpoint? — plausible as a data-quality check but not independently confirmed; needs direct cross-checking against live league data.
- [ ] How reliable is coverage of pre-Week-1 and off-season transaction rounds, and is there a documented cutoff before which the endpoint should not be trusted? — needs direct sampling across leagues during the pre-draft and immediate post-draft period, since no source treats this window as reliably documented.
