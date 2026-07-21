---
title: "Sleeper Users Endpoint Structure"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - ownership-model
  - player-id-mapping
related:
  - sleeper-api/roster-endpoint
  - sleeper-api/transactions-endpoint
---

## Summary

`GET /league/{league_id}/users` returns league member accounts, not fantasy teams — the response has no `roster_id` at all, and mapping a user to the team they manage requires a separate join to the rosters endpoint via `owner_id` (and `co_owners`, for shared ownership). `user_id` is the only safe, stable identity key across seasons and leagues; `display_name`, `username`, and the league-scoped `metadata.team_name` are all mutable display labels that must never be used as keys or assumed unique. Both endpoints reflect current state only — neither is a historical ownership ledger, so a roster that changed hands mid-season cannot have its past ownership recovered from these two endpoints alone.

---

## Core Knowledge

### This Endpoint Returns Accounts, Not Teams

Every object in the array returned by `GET /league/{league_id}/users` is a Sleeper account associated with the league — `user_id`, `display_name`, `username`, `avatar`, `metadata`, and `is_owner`. None of these objects carry a `roster_id`, and there is no field here that identifies which fantasy team, if any, a given user manages. Team identity and roster assignment live entirely on the separate rosters resource; this endpoint answers "who is in this league" and the rosters resource answers "who owns which team." Treating the users endpoint as if it already contained team assignments is a fundamental misreading of the data model, not an edge case.

### The Canonical Join: rosters.owner_id to users.user_id

The mapping path from a fantasy team to the human running it is `roster.owner_id` (a `user_id`) joined to `users.user_id`, and, for shared-management leagues, `roster.co_owners` (an array of additional `user_id`s) joined the same way. This join is not guaranteed to be one-to-one in either direction: a roster's `owner_id` can be null (an orphaned team with no current owner), and a user appearing in the league's users array is not guaranteed to be the primary owner of any roster at all — they may be a co-owner, a commissioner with no team of their own, or a participant in some other transitional state. Any join between these two endpoints needs to be null-tolerant on both sides rather than assuming strict one-to-one correspondence.

### user_id Is the Only Safe Identity Key

`user_id` is a stable, global, permanent identifier for a Sleeper account, and it is the only field on this endpoint that is safe to use as a join key or a durable reference. `display_name` and `username` are both account-level, both mutable at any time by the account holder, and neither is guaranteed to stay unique in a way that makes it safe for historical joins — two members can share a similar or identical display name, and a name that uniquely identified a user last season may not this season. Any historical record, cross-session reference, or deduplication logic keyed on a name field instead of `user_id` will eventually misattribute or collide. This is the same identity model used by the standalone user-lookup and user-leagues endpoints — see `sleeper-api/user-leagues-endpoint` for how `user_id` is resolved and used outside a specific league's context.

### Team Names Live in metadata, Scoped to This League

The league-specific team name a user has set lives in `metadata.team_name` — it is not a top-level field, and it is scoped to this specific league membership rather than being a global account attribute. A user who has never set a custom team name for this league will have `metadata` present without a populated `team_name`, and some sources describe this surfacing as an outright-missing key while others describe it surfacing as an explicit empty string; a robust display implementation must treat both as "unset" rather than assuming only one representation occurs. The standard, consistently-corroborated display fallback order is: `metadata.team_name` if present and non-empty, else `display_name`, else `username`, else a generated fallback based on `roster_id` (for example, "Team {roster_id}"). This fallback chain is for presentation only — it must never be used to construct an identity key.

### is_owner Means Commissioner, Not Roster Owner

`is_owner` on a user object flags league-creator/commissioner status, and more than one user in a league can carry `is_owner: true` when a league has co-commissioners. This field has no relationship to which fantasy roster, if any, that user manages — a commissioner is not necessarily a roster owner, and a roster owner is not necessarily a commissioner. The field can also be absent or null rather than an explicit `false` for ordinary members, so code should treat a missing value as "not an owner" rather than expecting a guaranteed boolean. Do not use `is_owner` for any roster-ownership or team-attribution logic — it answers a completely different question.

### Current State Only — Not a Historical Ownership Ledger

Both the users endpoint and the rosters endpoint reflect current membership and current ownership at the moment of the request. Neither endpoint preserves what a roster's ownership was at some point in the past. If a roster changes hands mid-season — an owner departs and a new manager takes over, or a co-owner arrangement changes — a later read of these two endpoints will show only the current state; there is no way to recover who owned a given roster during, say, a completed week's matchup purely from these two resources. Any feature that needs to attribute historical decisions (a bad lineup call, a since-regretted trade) to the person actually responsible at the time needs its own periodic snapshotting of the ownership mapping — these endpoints cannot answer that question retroactively on their own. The transactions resource (`sleeper-api/transactions-endpoint`) can help partially reconstruct who initiated specific moves via its `creator` field, but `creator` reflects who acted, not necessarily who owned the roster at that moment, so it is a supplement to snapshotting, not a substitute for it.

### Avatar Handling

`avatar` on a user object is an avatar ID string, not a ready-to-use URL, and is resolved by the caller against Sleeper's CDN path convention; it can be null if the user has not set one. This avatar ID is account-level and distinct in both format and scope from any per-league custom avatar that may appear inside `metadata` — the two should not be conflated or resolved through the same code path, since they represent different images at different scopes.

---

## Key Decisions

- **Decision:** The platform will model users and rosters as two separate entities from the start — account identity keyed on `user_id`, team identity keyed on (`league_id`, `roster_id`) — joined via `owner_id`/`co_owners`, rather than collapsing them into a single "team" object anywhere in ingestion.
  **Reasoning:** The users endpoint fundamentally does not carry team assignment data; treating a user object as if it were a team record would require inventing a join that doesn't exist in the source data and would break the moment a roster is orphaned or co-owned.
  **Rejected alternative:** Flattening users and rosters into one combined "team" record at ingestion, as many third-party wrappers do, was rejected — it obscures orphaned rosters, co-ownership, and ownership changes that the platform needs to reason about explicitly.

- **Decision:** The platform will key every account reference exclusively on `user_id`, and will never use `display_name`, `username`, or `metadata.team_name` as a lookup or deduplication key anywhere in the schema.
  **Reasoning:** All three display fields are mutable and non-unique in practice; any historical or cross-session logic keyed on them will eventually collide or silently break when a user renames themselves.
  **Rejected alternative:** Using `display_name` as a convenience key for early development was rejected even as a temporary measure — the failure mode (silent historical misattribution) is exactly the kind of bug that is expensive to untangle after the fact.

- **Decision:** The platform will implement team-name display using the fallback chain `metadata.team_name` (treating both missing and empty-string as unset) → `display_name` → `username` → a generated `roster_id`-based label, applied consistently in one shared display-resolution function.
  **Reasoning:** This fallback order is the best-corroborated convention across sources and matches what users expect to see when they haven't set a custom team name; centralizing it in one function avoids inconsistent fallback behavior appearing in different parts of the product.
  **Rejected alternative:** Reading `metadata.team_name` directly wherever a team name is displayed, without a shared fallback function, was rejected — it risks inconsistent handling of the missing-vs-empty-string ambiguity across different call sites.

- **Decision:** The platform will perform a null-tolerant, left-join-style mapping from rosters to users (not an inner join), explicitly handling both a roster with no owner and a user with no owned roster as valid, non-error states.
  **Reasoning:** Orphaned rosters and non-owner league members are normal, expected states in real leagues, not corrupted data; an inner join would silently drop legitimate rosters or users from any feature built on top of it.
  **Rejected alternative:** Requiring every roster to resolve to exactly one owning user was rejected — it does not hold in practice and would force the platform to either error or silently hide legitimate orphaned-team states.

- **Decision:** The platform will periodically snapshot the roster-to-owner mapping (not just read it live) specifically to support any feature that needs to attribute a past decision to the person responsible at the time.
  **Reasoning:** Neither the users nor the rosters endpoint retains ownership history; without independent snapshotting, any historical-attribution feature would silently show the current owner for decisions made by a previous owner.
  **Rejected alternative:** Relying on live reads of current ownership for historical attribution features was rejected outright — it produces confidently wrong answers whenever ownership has changed, with no way to detect the error from the data alone.

---

## Open Questions

- [ ] Is a missing `metadata.team_name` key and a present-but-empty-string `metadata.team_name` ever meaningfully different (e.g. one indicating "never set" and the other "deliberately cleared"), or are both simply "unset" in every practical case? — needs direct sampling across real league data, since sources describe both representations occurring without resolving whether they carry different intent.
- [ ] Can a user appear in a league's users array without ever having been assigned to or having owned any roster in that league, beyond the known co-owner and commissioner-without-a-team cases — and if so, under what circumstances? — needs direct observation across a range of league states, since available sources describe the general possibility without an exhaustive list of causes.
- [ ] Does Sleeper expose any endpoint or historical resource capable of reconstructing past roster ownership (for leagues where a team changed hands mid-season), or is independent snapshotting genuinely the only option? — needs direct research against Sleeper's fuller endpoint surface, since the users/rosters endpoints alone confirm no such history is available on them specifically.
