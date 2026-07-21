---
title: "ESPN Draft Detail Response Structure (mDraftDetail)"
type: domain-knowledge
category: espn-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - undocumented-endpoint
  - league-settings
  - roster-structure
related:
  - espn-api/view-parameter-reference
  - espn-api/base-url-and-versioning
  - espn-api/roster-response-structure
---

## Summary

The `mDraftDetail` view returns a `draftDetail` object with `drafted`/`inProgress` status flags and a `picks` array — one entry per draft transaction, carrying `overallPickNumber`, `roundId`, `roundPickNumber`, `teamId`, `playerId`, `keeper`, and (for auction leagues) `bidAmount`. The single most important rule: explicit pick fields (`overallPickNumber`, `teamId`) are the source of truth for who drafted whom, never a snake-order formula reconstructed from team count and pick position — traded picks, keepers, and commissioner edits all break that reconstruction silently.

---

## Core Knowledge

### Response Shape

`draftDetail.drafted` (boolean) indicates draft completion; `draftDetail.inProgress` (boolean) indicates a currently active live draft. `draftDetail.picks` is the ordered transaction log. Each pick object carries, at minimum: `overallPickNumber` (global 1-indexed sequence), `roundId` (1-indexed round), `roundPickNumber` (pick number within the round), `teamId` (the selecting fantasy team), `playerId`, `keeper` (boolean), and `bidAmount` (auction winning bid; zero, absent, or meaningless for snake drafts). A `reservedForKeeper` boolean also appears in some seasons/leagues, marking a pre-draft keeper-slot reservation distinct from the post-pick `keeper` flag — this field is less consistently present than the core set and should not be assumed available.

### Pick Order Reconstruction Is a Fallback, Not the Source of Truth

For a clean snake draft with no trades or keepers, round and slot can be derived mathematically from `overallPickNumber` and team count, with odd rounds following the league's base draft order and even rounds reversing it. This derivation is useful only for validation or for leagues where explicit fields are missing — it must never override the recorded `teamId`, `roundId`, and `roundPickNumber` on each pick object. Reconstruction breaks specifically when: draft picks were traded prior to the draft, keepers consume irregular slots ahead of the live draft, a team was removed or added, or a commissioner manually edited the sequence. Always read team ownership directly from the pick object's `teamId`.

### Keeper Flag Is Not the League's Keeper-Cost Rule

`keeper: true` on a pick records that ESPN classified that acquisition as a keeper. It does not by itself establish which round-cost, salary, or inflation rule a specific league applies to retained players — those rules live outside this endpoint, in the league's own private configuration. A keeper still occupies a `roundId`/`roundPickNumber` slot as if drafted normally, meaning the next live pick in that round has a `roundPickNumber` that skips the keeper's slot; draft-flow or ADP analysis must filter out keeper picks first or risk treating retained (never actually available) players as normally drafted at an artificially early slot. Keeper cost, when tracked separately by a league (round-based or dollar-based), should be preserved as a distinct fact from the raw pick record rather than inferred from `roundId` alone.

### Auction bidAmount Is an Observed Price, Not a Valuation

`bidAmount` reflects the actual winning bid recorded for that pick in an auction draft. A zero value is ambiguous — it can mean the league is not an auction format, the field defaulted, a keeper's retained cost is represented elsewhere, or historical data is simply incomplete for that season. It should never be treated as a confirmed zero-dollar acquisition without corroboration. When a keeper is retained in an auction league, its `bidAmount` typically reflects the locked-in keeper cost from the prior season rather than a live bid, and the pick object does not flag this distinction — keeper-retained and live-bid picks are structurally identical, so `keeper` must be checked before treating `bidAmount` as a fresh auction outcome. Nomination order (which team nominated a player, as opposed to which team won them) is not recoverable from this endpoint in any consistently corroborated form — auction nomination-strategy analysis is structurally blocked by ESPN's data model.

### Live-Draft and Incomplete-State Behavior

During an active draft, `inProgress` is true, `drafted` is false, and `picks` is populated incrementally — a completed pick can lag appearing in the response by an observed but undocumented interval. There is no sequence token, etag, or other mechanism for reliably detecting new picks beyond polling and comparing array length. Draft-grade metrics (final ADP, full auction spend reconciliation) should not be computed until `drafted: true` and the pick count reconciles against expected roster size times team count.

### Historical and Cross-Season Reliability

Draft detail fidelity for older seasons is weaker than for current seasons, consistent with the general historical-data degradation documented for this API — some older seasons return empty `picks` arrays even where a draft is known to have occurred. `mDraftDetail` should not be assumed complete for any season without validating pick count against expected league size.

---

## Key Decisions

- **Decision:** The platform will read team ownership for every draft pick directly from that pick's `teamId` field, and will never derive team ownership from a reconstructed snake-order formula.
  **Reasoning:** Snake-order reconstruction is mathematically valid only in the absence of traded picks, keepers, and commissioner edits — all of which occur in Nick's actual leagues — and silently attributing a pick to the wrong team would corrupt draft-value and roster-construction features with no visible error.
  **Rejected alternative:** Using the snake-order formula as the primary source with `teamId` as a fallback was rejected — this inverts the correct trust hierarchy and would only surface reconstruction errors when they happen to disagree with the (unused) authoritative field.

- **Decision:** The platform will filter out `keeper: true` picks before any draft-value, ADP, or "positional run" analysis, and will store keeper status as a separate fact from any league-specific keeper-cost rule.
  **Reasoning:** A keeper pick was never actually available to the field, so including it in draft-value analysis artificially depresses the perceived cost of frequently-kept players; and the pick record's `keeper` flag and round/price fields do not encode a league's private keeper-cost formula, which must be sourced from `league_config` per `MASTER_CONTEXT.md` rather than inferred from the draft record.
  **Rejected alternative:** Inferring keeper cost directly from a kept player's `roundId` or `bidAmount` was rejected — it conflates ESPN's operational record of what happened with the league's private economic rule for why, which are not guaranteed to align.

---

## Open Questions

- [ ] Whether `reservedForKeeper` is reliably present across all league configurations and seasons, or is a season-dependent field, is not established — needs verification against a range of live leagues before being relied upon.
- [ ] The exact typical lag between a live pick being made and appearing in the `picks` array is not documented — needs empirical measurement during an actual live draft before building real-time draft-tracking UI.
- [ ] Whether commissioner post-draft edits to picks are fully retroactive in the stored record or leave any detectable artifact is unconfirmed.
