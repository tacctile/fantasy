---
title: "Sleeper User and User-Leagues Endpoints"
type: domain-knowledge
category: sleeper-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - endpoint-structure
  - league-settings
  - scoring-configuration
  - ownership-model
  - undocumented-endpoint
related:
  - sleeper-api/league-endpoint
  - sleeper-api/roster-endpoint
  - sleeper-api/users-endpoint
---

## Summary

`GET /user/{username or user_id}` is Sleeper's global identity lookup — it resolves either a username or a numeric `user_id` to the same account object and is the entry point for turning a human-entered username into the stable `user_id` that everything else in the platform should key on. `GET /user/{user_id}/leagues/nfl/{season}` is a separate, season-scoped discovery endpoint returning every league object a user belongs to for a given year; it requires the numeric `user_id`, not username, and returns full league-summary objects rather than bare membership records. Neither endpoint is a source of roster ownership or team assignment — that resolution still happens through the league-scoped rosters and users endpoints — and neither preserves historical membership, so a manager who leaves a league disappears from this view going forward with no trace of past involvement.

---

## Core Knowledge

### Two Endpoints, Two Purposes

`GET /user/{username or user_id}` is identity resolution: given either identifier form, it returns the same minimal account object. `GET /user/{user_id}/leagues/nfl/{season}` is league discovery: given a numeric `user_id`, a sport (`nfl` is the only officially supported value), and a season year, it returns every league that account belongs to for that season. These answer fundamentally different questions — "who is this account" versus "what leagues does this account play in this year" — and neither substitutes for the other. There is no global league directory anywhere in the API; the user-leagues endpoint is the only league-discovery mechanism available, which means any fleet-wide analysis across many users must budget one call per user per season.

### The User Object: user_id Is the Only Stable Key

The user object returned by the identity endpoint carries `user_id` (a stable, permanent snowflake-style string), `username` (a mutable, user-changeable login handle), `display_name` (a cosmetic label that can differ from `username` and is not guaranteed unique), and `avatar` (an avatar ID, not a ready-to-use URL). The endpoint accepts either `username` or `user_id` in the same path position, and this is deliberate: the intended pattern is to resolve a username to its `user_id` once, then use the numeric ID for every subsequent call, because usernames can and do change while `user_id` never does. Treating `username` as a durable identifier is the single most common integration bug against this endpoint — a cached username-based reference silently breaks the moment the account holder renames themselves.

### Avatar Resolution

`avatar` is an opaque ID, not a URL. The caller constructs the actual image address using Sleeper's CDN convention: full-size at `https://sleepercdn.com/avatars/{avatar_id}`, thumbnail at `https://sleepercdn.com/avatars/thumbs/{avatar_id}`. A `null` avatar means the user has not set one and should fall back to a default image rather than attempting to construct a URL from a null value. This is the same resolution pattern used for league avatars elsewhere in the API.

### The User-Leagues Endpoint: Season-Scoped Discovery

`GET /user/{user_id}/leagues/nfl/{season}` requires the numeric `user_id` specifically — the leagues path does not reliably accept username the way the identity endpoint does, so any caller reaching this endpoint should already have resolved to `user_id` first. `{season}` is a four-digit year passed as a string (for example `"2026"`); there is no "current season" alias, so the caller must know or compute the correct year, and the NFL "season" year is the fall calendar year even for games played into the following January or February. The response is an array — empty if the user has no leagues that season, never null for a valid user — of full league-summary objects, not lightweight membership stubs.

### League Summary Object Fields

Each league object returned by this endpoint carries substantially the same shape as the standalone league endpoint: `league_id`, `name`, `season`, `season_type`, `sport`, `status` (`pre_draft`, `drafting`, `in_season`, `complete`), `total_rosters`, `settings` (playoff structure, waiver configuration, trade deadline, roster mechanics — the full operational configuration), `scoring_settings` (the stat-to-point-value map), `roster_positions` (the ordered lineup slot layout, including bench, IR, and taxi entries), `draft_id`, `previous_league_id`, `avatar`, and `metadata`. See `sleeper-api/league-endpoint` for the full breakdown of what each of these substructures contains and their known documentation gaps — that detail is not repeated here since it is identical regardless of whether the league object arrives via this endpoint or the standalone league lookup.

### previous_league_id: Dynasty History Traversal

`previous_league_id` links a league to its predecessor from the prior season, and is `null` for a league's first season. This is the mechanism for reconstructing a dynasty or keeper league's multi-year history: walk the chain backward, one league object at a time, rather than assuming a single `league_id` persists across seasons — it does not, since league renewal mints a fresh `league_id` every season (see `sleeper-api/league-endpoint`). The chain is not guaranteed unbroken: a commissioner who manually recreates a league instead of using the platform's renewal path produces a gap with no `previous_league_id` pointing backward, and very old league instances may become unresolvable. Chain-walking logic must tolerate a break rather than treating it as an error condition.

### Distinguishing This Endpoint from /league/{league_id}/users

This page's identity endpoint (`/user/{id}`) and the league-scoped members endpoint documented on `sleeper-api/users-endpoint` (`/league/{league_id}/users`) are easy to confuse by name but answer different questions at different scopes. The identity endpoint here is global and account-centric — one user, looked up directly, with no league context. The league members endpoint is league-scoped and roster-adjacent — every account belonging to one specific league, including league-specific fields like `is_owner` and `metadata.team_name` that do not exist on the bare account object returned here. Do not expect this endpoint to return team names, commissioner flags, or roster assignments — those are properties of league membership, not of the global account.

### Edge Cases: Departed Managers, Co-Managers, Orphaned Rosters

The user-leagues endpoint reflects current membership only — a manager who was removed from a league, or who left mid-season, disappears from this endpoint's response for that season going forward, with no historical trace recoverable from this endpoint alone. Co-managed rosters introduce a further wrinkle: some sources describe this endpoint as reliably surfacing a league for every co-manager on a shared roster, while others describe it as associating the league primarily with the roster's main `owner_id` and not consistently returning it for every `co_owners` entry. This is not fully resolved across available sources and should be treated as an open question rather than a settled fact — the reliable way to enumerate co-managers for a specific league is to read that league's rosters resource directly and inspect `co_owners`, rather than relying on every co-manager's own user-leagues call to surface the league.

### Season Typing and Sport Scoping

The `sport` segment of the path is documented as supporting `nfl`; other values may respond in practice for other Sleeper-supported sports, but relying on that is not a documented guarantee for this platform's purposes and NFL is the only value this platform needs. `season_type` on returned league objects is typically `"regular"` for standard fantasy leagues; preserve the value as returned rather than hard-coding an assumption, since Sleeper could introduce other season types without notice.

---

## Key Decisions

- **Decision:** The platform will resolve every username to its `user_id` exactly once at the point of entry (login, league import, or manual lookup) and will persist and key all downstream data on `user_id`, never on `username` or `display_name`.
  **Reasoning:** `user_id` is the only field on either endpoint guaranteed to be stable over time; usernames are explicitly mutable, and any cached reference keyed on one will silently break the first time an account holder renames themselves.
  **Rejected alternative:** Allowing username as an acceptable long-lived reference anywhere in the schema was rejected — the failure mode (a dead lookup after a rename) is exactly the kind of silent breakage this decision exists to prevent.

- **Decision:** The platform will treat the user-leagues endpoint purely as a discovery mechanism for which leagues to import for a given user and season, and will always resolve actual roster ownership and team assignment separately through that league's rosters and users resources, never by assuming a positional or implicit link within the leagues array itself.
  **Reasoning:** The league-summary objects returned here carry no `roster_id` or ownership information at all; ownership is a league-scoped fact that only the rosters endpoint can answer, consistent with the platform's existing decision on `sleeper-api/users-endpoint` to never collapse account and team identity together.
  **Rejected alternative:** Assuming the order or count of leagues returned here implies anything about roster assignment within each league was rejected — no such relationship exists in the data.

- **Decision:** The platform will walk the `previous_league_id` chain backward to reconstruct dynasty and keeper league history, storing the resolved chain rather than recomputing it on every read, and will tolerate a broken chain (a missing `previous_league_id`) as a normal, non-error state.
  **Reasoning:** This is the only mechanism available for connecting a league's multi-season history, since `league_id` itself is not stable across renewals; manual league recreation genuinely does produce unresolvable gaps that the platform must handle gracefully rather than treat as corrupted data.
  **Rejected alternative:** Requiring an unbroken `previous_league_id` chain as a precondition for dynasty-history features was rejected — it would silently exclude any league whose commissioner ever manually recreated it instead of using the platform's renewal path.

- **Decision:** The platform will cache league-summary objects returned from this endpoint using the same slow-changing-resource policy already applied to the standalone league endpoint (fetch once per league on sync, refresh on explicit trigger), rather than treating a repeated user-leagues call as the refresh mechanism for league configuration.
  **Reasoning:** The league-summary shape here is identical to the standalone league object, and league settings rarely change mid-season regardless of which endpoint surfaced them; applying one consistent caching policy avoids redundant, endpoint-specific caching logic for what is fundamentally the same underlying data.
  **Rejected alternative:** Treating data from this endpoint as fresher or more authoritative than the standalone league endpoint's data was rejected — there is no basis for that distinction, and maintaining two separate caching policies for the same object shape would add complexity with no benefit.

- **Decision:** The platform will enumerate a league's co-managers by reading that league's rosters resource and inspecting `co_owners` directly, rather than relying on every co-manager's individual user-leagues call to confirm their membership.
  **Reasoning:** Available sources disagree on whether this endpoint reliably returns a league for every co-manager on a shared roster; the rosters endpoint's `co_owners` field is the more directly authoritative source for this specific question and avoids depending on unresolved behavior.
  **Rejected alternative:** Treating a co-manager's presence or absence in their own user-leagues response as authoritative for co-management status was rejected — the behavior is not consistently corroborated enough to build logic against directly.

---

## Open Questions

- [ ] Does this endpoint reliably return a league for every co-manager on a shared roster, or does it primarily associate the league with the roster's main `owner_id` only? — sources disagree; needs direct testing with a real co-managed league across multiple user accounts.
- [ ] Does the season-scoped leagues list reflect membership as of the moment of the call only, or can it retroactively reflect membership changes that occurred earlier in that season? — needs direct observation of a league membership change mid-season followed by a user-leagues call for that season.
- [ ] Is there a documented or reliable cutoff for how far back `previous_league_id` chains remain resolvable, or can very old dynasty league instances become permanently unresolvable? — needs direct sampling across long-running dynasty leagues, since no source establishes a retention policy.
- [ ] Does passing a non-"nfl" value in the sport segment of the leagues path behave reliably, or is NFL genuinely the only supported and stable value for this platform's purposes? — low priority given the platform's NFL-only scope, but worth confirming if any future multi-sport feature is considered.
