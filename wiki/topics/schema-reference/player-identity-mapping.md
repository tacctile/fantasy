---
title: "ADR: Platform-Agnostic Player Identity Mapping"
type: decision-record
category: schema-reference
status: active
last_updated: "2026-07-21"
confidence: high
tags:
  - player-id-mapping
  - endpoint-structure
related:
  - schema-reference/league-identity-and-scoping
  - schema-reference/league-configuration-data-model
  - sleeper-api/player-id-crosswalk
  - sleeper-api/dst-and-free-agents
  - espn-api/player-id-inconsistencies
---

## Context

`MASTER_CONTEXT.md` already mandates a Sleeper-anchored canonical player key (`sleeper_player_id`), with `espn_player_id` joining to it via a mapping layer rather than a parallel table — this decision fixes exactly how that mapping layer is built and populated now that both providers' player-identity research is complete. Sleeper embeds several external IDs directly (`espn_id`, `yahoo_id`, `sportradar_id`, `gsis_id`) but never a PFR ID, with uneven population concentrated in rookies and IDP-relevant players. ESPN provides no native cross-provider mapping at all — its `playerId` is proprietary and reachable only through an external, community-maintained crosswalk. Both providers also carry a documented, structurally distinct D/ST representation (Sleeper uses the team abbreviation as `player_id`; ESPN assigns D/ST its own player-like `playerId`, separate from `proTeamId`) that the mapping layer must not corrupt by treating defenses as ordinary athlete records.

---

## Decision

The platform's canonical player key remains `sleeper_player_id`, per the existing schema rule. The platform owns and maintains a local `player_id_crosswalk` table, keyed on `sleeper_player_id`, with nullable string columns for `espn_player_id`, `gsis_id`, `yahoo_id`, `sportradar_id`, and `pfr_id`.

Population order: Sleeper's own embedded external-ID fields populate the crosswalk first (direct, exact-key joins for `espn_player_id`, `gsis_id`, `yahoo_id`, `sportradar_id` wherever Sleeper's dump has them non-null). A maintained third-party crosswalk (the nflverse/DynastyProcess table, which already keys on `sleeper_id`) reconciles gaps second — this is the only path to `pfr_id`, which Sleeper never provides, and it also backfills population gaps in Sleeper's own fields. A dedicated local ESPN-specific reconciliation pass fills `espn_player_id` gaps the first two steps miss, since ESPN offers no native crosswalk of its own and community crosswalks are known to lag specifically for the populations most likely to break platform joins — new rookies, practice-squad players, and D/ST entities. Name-based matching (Sleeper's `search_full_name` plus position and birth date) is permitted only as a last-resort fallback across all of the above, and any name-based match is flagged for review rather than trusted at the same confidence tier as an ID-based join.

D/ST entities get their own crosswalk row, anchored on Sleeper's team-abbreviation-style `player_id` (e.g., `"DET"`), with `espn_player_id` populated from ESPN's separate D/ST `playerId` — never derived from or compared against `proTeamId`. Every column in the crosswalk table, and every ID value flowing through the pipeline generally, is stored and compared as a string; no numeric coercion is applied anywhere, since both Sleeper's DST abbreviations and dash-formatted GSIS IDs are non-numeric and would be silently corrupted by integer casting.

---

## Rationale

Anchoring on Sleeper is not a new choice here — it's already the platform's schema rule, and Sleeper is the universal backbone for player data across the entire app regardless of which platform a given league runs on, including the ESPN leagues. What this decision adds is the concrete shape of the crosswalk itself, and that shape is dictated directly by what each provider's own research already established: Sleeper is strong but incomplete (no PFR, uneven rookie coverage); ESPN is a dead end without an external crosswalk (no native mapping of any kind). A single local table populated in that priority order — Sleeper direct, then community crosswalk, then a dedicated ESPN reconciliation pass — means the platform never depends on a single source being complete, and every gap has a specific, documented next step rather than an unhandled null.

The D/ST special-casing is not optional cleanup — it is the single most consistently corroborated pitfall in the ESPN player-ID research (conflating D/ST `playerId` with `proTeamId`) and a documented Sleeper quirk in its own right (team abbreviation as `player_id`, no external IDs at all for defenses). Treating D/ST as an ordinary athlete row with the same ID assumptions as a human player would silently corrupt every defense-related feature the platform builds.

---

## Rejected Alternatives

**Alternative 1: Anchor canonical identity on ESPN's `playerId`, or introduce a new synthetic platform-neutral ID**
- Would either make ESPN the hub of the crosswalk, or invent a third ID system independent of both providers.
- Rejected because it directly contradicts the existing, already-decided schema rule (Sleeper-anchored identity), and because ESPN's `playerId` is structurally the worse anchor regardless — it has no native cross-provider mapping at all, whereas Sleeper already embeds direct joins to most of what the platform needs.

**Alternative 2: Rely entirely on the nflverse/DynastyProcess crosswalk with no local reconciliation table**
- Would treat the external community crosswalk as sufficient on its own, re-querying or re-downloading it whenever a mapping is needed rather than maintaining a local table.
- Rejected because that crosswalk is volunteer-maintained with no service-level guarantee and no established fallback plan if its maintenance cadence stalls, and because its own coverage gaps are concentrated in the exact populations (new rookies, IDP players) where the platform's draft-season features need identity resolution most. Owning a local table means the platform can patch gaps itself rather than being blocked on an external project's update cycle.

**Alternative 3: Treat name-based matching as an acceptable automated fallback with the same confidence as ID-based joins**
- Would let a name/position match flow through the same pipeline as a direct-ID or crosswalk match without a distinct trust tier.
- Rejected because full-name collisions are a well-corroborated, high-impact silent-failure pattern across an 11,000-plus-player universe on both the Sleeper and ESPN sides of the research — allowing automated name matches into the same trust tier as ID-based joins would let silent misidentification reach player-evaluation and roster features undetected.

---

## Date

Decision made: 2026-07-21
Last reviewed: 2026-07-21
