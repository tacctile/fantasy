---
title: "ESPN Fantasy API Base URL Structure and Versioning"
type: domain-knowledge
category: espn-api
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - rest-api
  - undocumented-endpoint
  - endpoint-structure
  - league-settings
  - roster-structure
related:
  - espn-api/authentication
  - espn-api/format-requirements
  - espn-api/data-completeness
---

## Summary

ESPN's Fantasy Football API is an undocumented, reverse-engineered v3 REST surface with no published schema, versioning contract, or deprecation policy. Its canonical current-season structure is `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{seasonId}/segments/0/leagues/{leagueId}`, where the returned payload shape is controlled almost entirely by `view` query parameters rather than the base path itself. Historical seasons route through a structurally different `leagueHistory` endpoint, and treating `leagueId` as a sufficient identifier on its own — without season, game code, and segment — is the most common source of misrouted requests.

---

## Core Knowledge

### Base URL Structure

The current-season league endpoint:

`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/{seasonId}/segments/0/leagues/{leagueId}`

Path components and their actual meaning:

- **Host** — `lm-api-reads.fantasy.espn.com` is the current preferred read host. An older host form, `fantasy.espn.com/apis/v3/...`, remains referenced in older tooling and community write-ups and may still resolve in some contexts, but current maintained libraries standardize on `lm-api-reads`. There is no published guarantee either host remains stable long-term — ESPN has changed hosting arrangements before without announcement.
- **`/apis/v3`** — a route-generation label, not a semantic version number. It does not imply schema stability, backward compatibility, or a minor/patch versioning scheme (there is no `v3.1`). ESPN can and does change response fields, accepted views, and backend behavior within `v3` without changing this path segment. Treat it as "current route family," not as a contract.
- **`/games/ffl`** — the game code identifying Fantasy Football specifically. Other ESPN fantasy products (baseball, basketball, hockey) use different game codes and have their own view sets, roster structures, and player pools that do not carry over.
- **`/seasons/{seasonId}`** — the fantasy season, expressed as a four-digit year corresponding to the year the NFL season begins (e.g., a season starting September 2025 is `seasons/2025`, even though the fantasy championship and postseason extend into January 2026). This is not the calendar date of the request and not the year fantasy activity concludes. Season must always be passed explicitly — deriving it from the current wall-clock date is unreliable, particularly during the January–August offseason window when "current season" is ambiguous even among community libraries.
- **`/segments/0`** — a constant for standard, season-long Fantasy Football leagues. It is not a week, matchup period, playoff flag, or division identifier, and there is no documented mechanism by which changing it retrieves different data for ordinary leagues. It should be treated as a fixed part of the path, not a variable parameter.
- **`/leagues/{leagueId}`** — the league's numeric ID. It should be treated as an opaque identifier (stored/transmitted as a string, not used for arithmetic or assumed to fit any particular numeric range) and is only meaningful in combination with game code, season, and segment — the same `leagueId` does not resolve to a consistent, comparable entity across different seasons without the season being specified correctly.

The safe composite identity for any request or cached record is therefore **(game, season, segment, leagueId)**, not `leagueId` alone.

### The View-Parameter System Controls Payload Shape

The base league endpoint alone returns only a minimal league shell. Actual data — settings, rosters, matchups, standings, draft results — is retrieved by appending one or more `view` query parameters, e.g. `?view=mSettings&view=mRoster&view=mMatchup`. Commonly used views include `mSettings` (league/scoring/roster rules), `mTeam` (teams, owners, records), `mRoster` (rosters and lineup slots), `mMatchup`/`mMatchupScore` (schedule and scoring), `mStandings`, `mDraftDetail` (draft results and auction values), and `kona_player_info` (player-pool data, typically combined with a request filter — see below).

Multiple views requested together do not behave as a simple additive union — the merged response can nest or omit fields differently than any single view requested alone. A response can return **HTTP 200 with valid JSON but silently sparse data** simply because a needed view wasn't requested; this is not an error condition and will not raise an exception in most client libraries, making it one of the most common silent failure patterns in ESPN integrations. Validate the actual returned shape against what the calling code expects rather than assuming a view name guarantees a fixed set of fields.

### X-Fantasy-Filter Header for Player-Pool Queries

Player-pool and some player-oriented views (notably `kona_player_info`) commonly require a separate `X-Fantasy-Filter` HTTP header carrying a JSON-serialized filter object (limits, player ID lists, eligibility/status filters, sort order) to avoid truncated or default-limited results. This is a header mechanism, entirely distinct from `view` query parameters, and its accepted structure is not officially documented — it is reconstructed from observed browser traffic and can change as ESPN's own web client evolves.

### Historical Seasons Use a Structurally Different Endpoint

Older seasons are not retrieved by simply changing `{seasonId}` in the modern path. The historical form is:

`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/{leagueId}?seasonId={seasonId}`

A key structural difference: the modern endpoint returns a single JSON object, while the `leagueHistory` endpoint has historically returned a **JSON array** (even for a single requested season), requiring callers to index the first element. A parser written only against the modern object shape will fail against this endpoint, and vice versa.

ESPN has progressively reduced availability of pre-2018 historical data over time — some seasons in this range return empty structures, malformed data, or outright 404s. There is no authoritative, stable cutoff date guaranteeing which historical seasons remain retrievable; availability should be treated as unreliable and degrading over time rather than fixed, and any specific date claimed for when this purge occurred or completed should be treated with skepticism absent direct verification, since panel sources gave inconsistent specific dates for both the host migration and the historical-data purge.

### No Versioning Contract — Schema Drift Within v3

The single most important framing for this API: `v3` denotes a route family, not a frozen schema. ESPN can add, rename, or remove response fields, change accepted view names, or alter authentication behavior at any time without incrementing the version path or publishing a changelog. Community client libraries (Python's `espn-api`, R's `ffscrapr`, various JS wrappers) exist specifically because there is no official SDK, and they lag ESPN's actual behavior by definition — they are reverse-engineered and updated reactively after breakage is discovered, typically at the start of a new season or after an ESPN web-client redesign.

---

## Key Decisions

- **Decision:** The platform's ESPN ingestion layer will construct requests around the explicit composite key (game code, season, segment, league ID) and will never cache, key, or reason about ESPN league data using `leagueId` alone.
  **Reasoning:** The same numeric `leagueId` does not represent a consistent, comparable entity across seasons without season specified — team membership, settings, and even data availability can differ entirely season to season for the same ID, and using `leagueId` alone as a cache or lookup key is a documented source of misrouted or stale data.
  **Rejected alternative:** Keying storage and requests by `leagueId` alone with season as a secondary filter was rejected — it invites accidental cross-season data leakage in any code path that forgets to apply the season filter explicitly.

- **Decision:** The platform will request only the specific `view` parameters a given feature actually needs, and will validate the returned JSON shape (presence of expected fields) rather than assuming a view name guarantees a fixed schema.
  **Reasoning:** A `200` response with silently sparse data — caused by an omitted view, not an error — is the most common integration failure pattern reported across sources; explicit shape validation catches this class of bug where status-code checking alone would not.
  **Rejected alternative:** Requesting a broad, fixed set of views on every call "to be safe" was rejected — it increases payload size and latency unnecessarily and does not eliminate the need for shape validation anyway, since even a requested view can return incomplete nested data depending on league/season state.

- **Decision:** ESPN base-URL and view-parameter construction will be isolated behind a single internal helper rather than inlined at each call site, and will treat `v3` as a route label rather than a stability guarantee — meaning response parsing must tolerate unexpected/missing fields rather than failing hard.
  **Reasoning:** Consistent with `MASTER_CONTEXT.md`'s requirement to isolate ESPN integration defensively from the rest of the platform, centralizing URL construction is the only practical way to absorb a future host or path change without touching every call site, and defensive parsing is the only viable posture against an API with no published deprecation process.
  **Rejected alternative:** Hardcoding the base URL string at each call site was rejected as directly contradicting the platform's requirement to isolate ESPN's fragility from the rest of the codebase — a host or path change would otherwise require a multi-file search-and-replace under time pressure during the season.

---

## Open Questions

- [ ] The exact date(s) of ESPN's host migration from `fantasy.espn.com` to `lm-api-reads.fantasy.espn.com`, and of the ongoing pre-2018 historical-data purge, are not established — panel sources gave inconsistent specific dates for both, and no single date should be treated as authoritative without direct verification.
- [ ] Whether ESPN will introduce a distinct `v4` route family or continue evolving schema silently within `v3` indefinitely is unknown — there is no public roadmap or deprecation-notice process to monitor.
- [ ] The full, exhaustive set of valid `view` values and their exact field-level output per season is not documented anywhere and is only known through community reverse-engineering; new views or filter capabilities can appear when ESPN's own web client adds features, with no advance notice to third-party integrators.
- [ ] The precise structure and full accepted key set for the `X-Fantasy-Filter` header's JSON payload is incompletely documented and has reportedly changed across seasons — needs direct endpoint-by-endpoint verification once the platform's ESPN player-pool integration work begins.
