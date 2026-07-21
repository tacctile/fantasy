# Fantasy Football Platform Wiki — Verification Cache

> **Tracks factual claims verified across wiki sessions**
>
> **Purpose:** Prevent re-verifying the same claim in future sessions. Any claim verified
> within 90 days can be trusted from this cache. Claims older than 90 days must be
> re-verified and the cache entry updated.
>
> **90-day trust window:** Checked on the `Verified` date. If today's date is more
> than 90 days past the `Verified` date, treat the entry as stale — re-verify
> via web search and update the `Verified` and `Next Review` fields.
>
> **5-minute verification cap:** If a claim cannot be resolved in 5 minutes of
> searching, stop. Set `confidence: medium` on the affected page, add the claim to
> that page's Open Questions section, and add a note here in Unresolved Conflicts.
>
> **What gets cached:**
> - Platform-specific feature availability claims
> - Regulatory and legal claims (with statute citations)
> - Pricing and plan structure data (with approximate date context)
> - Company status claims (active, acquired, shut down)
> - Statistical methodology claims (e.g., exact formula definitions)
>
> **What never gets cached:**
> - Design patterns, analytical principles, strategic frameworks — these don't expire
> - Synthesis conclusions ("most analysts use X") — these are judgment calls, not facts

---

## Statistical & Methodology Claims

| Topic | Claim | Source | Verified | Next Review |
| ----- | ----- | ------ | -------- | ----------- |
| WOPR formula | WOPR = 1.5 × Target Share + 0.7 × Air Yards Share (Josh Hermsmeyer's canonical formula) | chathub.gg 6-model panel, 5-of-6 models confirmed; 1 model reported an unconfirmed alternate (0.75/0.25) attributed to a single platform | 2026-07-17 | 2026-10-15 |
| FPOE/xFP/VORP consensus | Core mechanics, platform variance, edge cases, and best practices across FPOE, xFP, VORP/VBD align across 6-model panel with high confidence. | chathub.gg 6-model panel convergence filtering (subjects 1.16, 1.17, 1.18); all 6 models agree on mechanics, edge cases, pitfalls; single-model claims on empirical coefficients flagged for future verification. | 2026-07-17 | 2026-10-15 |
| Wind threshold for passing degradation | ~15 mph sustained wind is the consensus threshold where passing efficiency begins degrading materially; effect is non-linear and disproportionately affects deep passing over short passing. | chathub.gg 6-model panel (subject 2.21); 6-of-6 models converge on the ~15 mph threshold and the deep-vs-short asymmetry. | 2026-07-17 | 2026-10-15 |
| Eastward vs. westward travel asymmetry | Eastward travel (advancing the body clock) is more circadian-disruptive than westward travel (delaying the body clock); the clearest documented case is a West Coast team traveling east for an early local kickoff. | chathub.gg 6-model panel (subject 2.22); 4+ of 6 models converge on this directional asymmetry. | 2026-07-17 | 2026-10-15 |
| Divisional-game line reliability | Point spreads and totals in divisional matchups carry systematically higher error than non-divisional games, plausibly due to familiarity compressing market-priced variance. | chathub.gg 6-model panel (subject 2.20); 3+ of 6 models converge; no source provided a validated error-magnitude figure. | 2026-07-17 | 2026-10-15 |
| Sleeper read API requires no auth; no API-level private-league concept | Sleeper's public REST API (`api.sleeper.app/v1`) requires no API key, token, or OAuth for any read endpoint; consequently any league is fully readable by anyone holding its league ID, regardless of in-app privacy settings. | chathub.gg 6-model panel (subjects 5.1-5.3, initial broad-scope run, 2026-07-17) — 6-of-6 agreement; independently re-confirmed by a second, cleanly-scoped 6-model panel re-run isolating 5.1-5.3 specifically (2026-07-21) — 6-of-6 agreement again, with no dissent across either run. | 2026-07-21 | 2026-10-19 |
| Sleeper fpts split integer/decimal representation | Sleeper roster `settings.fpts` and `fpts_decimal` (and equivalent points-against/projected pairs, `fpts_against`/`fpts_against_decimal` and `ppts`/`ppts_decimal`) are two fields representing one decimal score, e.g. `fpts:1234` + `fpts_decimal:56` = 1234.56 points — not independent statistics. | chathub.gg 6-model panel (subject 5.3); corroborated in the initial broad-scope run (2026-07-17) and reinforced by 5+ of 6 responses in the cleanly-scoped redo (2026-07-21), which additionally corroborated the `fpts_against`/`ppts` variants of the same split. | 2026-07-21 | 2026-10-19 |
| Sleeper league renewal issues a new `league_id` each season | Renewing a Sleeper league into a new season does not reuse the prior `league_id`; a new league object with a new `league_id` is created and linked backward via `previous_league_id`. Manually recreated (non-renewed) leagues break this chain entirely. | chathub.gg 6-model panel, cleanly-scoped redo of subject 5.2 (2026-07-21); 4+ of 6 responses converge explicitly on this behavior. | 2026-07-21 | 2026-10-19 |
| Sleeper roster bench has no dedicated array — must be derived | The roster endpoint returns no `bench` field. Bench must be computed by the caller as `players` minus `starters` minus `reserve` minus `taxi` (a three-way subtraction); subtracting only `starters` misclassifies reserve/IR and taxi players as bench. | chathub.gg 6-model panel, cleanly-scoped redo of subject 5.3 (2026-07-21); 5+ of 6 responses converge on both the missing-bench-array fact and the specific two-way-subtraction bug. | 2026-07-21 | 2026-10-19 |
| Sleeper matchups endpoint is roster-centric, not matchup-centric | `GET /league/{league_id}/matchups/{week}` returns one object per roster, not one object per head-to-head contest; pairings must be reconstructed by grouping rows on `matchup_id`, discarding nulls. There is no `opponent` field anywhere in the payload. | chathub.gg 6-model panel, cleanly-scoped run for subject 5.4 (2026-07-21); 6-of-6 unanimous agreement, each response independently identifying this as the single most important structural fact of the endpoint. | 2026-07-21 | 2026-10-19 |
| Sleeper draft pick ownership: roster_id is authoritative, not draft_slot or picked_by | On `GET /draft/{draft_id}/picks`, `roster_id` reflects the actual team that owns a pick's outcome including in-draft trades; `draft_slot` is the original, unchanging board position, and `picked_by` is only the human who executed the selection (often an empty string for autopicks/commissioner picks). Using `draft_slot` or `picked_by` for team attribution is a well-corroborated common failure pattern. | chathub.gg 6-model panel, cleanly-scoped run for subject 5.5 (2026-07-21); 6-of-6 unanimous agreement on the distinction and the associated failure pattern. | 2026-07-21 | 2026-10-19 |
| Sleeper users endpoint has no roster_id — team mapping requires a join to rosters | `GET /league/{league_id}/users` returns accounts only; there is no `roster_id` field anywhere in the response. Mapping a user to the team they manage requires joining `rosters.owner_id` (and `co_owners`, for shared ownership) back to `users.user_id`. | chathub.gg 6-model panel, cleanly-scoped run for subject 5.6 (2026-07-21); 6-of-6 unanimous agreement. | 2026-07-21 | 2026-10-19 |
| Sleeper transactions: `type` field and failed-waiver-claims are returned | `GET /league/{league_id}/transactions/{round}` classifies transactions via `type` (`waiver`, `free_agent`, `trade`); failed waiver claims are returned alongside completed ones via `status`, and naive aggregation without filtering on `status` overcounts activity. Asset movement (players, draft picks, FAAB) is represented uniformly across all three types via `adds`/`drops`/`draft_picks`/`waiver_budget`. | chathub.gg 6-model panel, cleanly-scoped run for subject 5.7 (2026-07-21); 6-of-6 agreement on `type` as classifier and on failed claims being returned; 5+ of 6 agreement on the uniform asset-movement model across types. | 2026-07-21 | 2026-10-19 |
| Sleeper user_id is the only durable identity key; username is mutable | `user_id` is a stable, permanent identifier; `username` and `display_name` are both mutable and must never be used as a durable join key or cache key. `GET /user/{username or user_id}` accepts either form but the leagues endpoint (`/user/{user_id}/leagues/nfl/{season}`) requires the numeric `user_id`. | chathub.gg 6-model panel, cleanly-scoped run for subject 5.8 (2026-07-21); 6-of-6 agreement on user_id durability and username mutability; 4+ of 6 agreement that the leagues endpoint specifically requires user_id over username. | 2026-07-21 | 2026-10-19 |
| Sleeper playoff bracket progression is encoded via t1_from/t2_from reference objects | `GET /league/{league_id}/winners_bracket` and `/losers_bracket` return match objects where an undetermined participant slot is filled via a `t1_from`/`t2_from` object of the form `{w: match_id}` or `{l: match_id}`, referencing a prior match's winner or loser. Final placement is read from the `p` field where present (p:1 = championship, p:3 = third place, etc.), not inferred from round or match ID alone. | chathub.gg 6-model panel, cleanly-scoped run for subject 5.9 (2026-07-21); 6-of-6 agreement on the reference-object mechanism and the `p`-field placement ladder, including convergence on the official documented 6-team worked example (m1-m7). | 2026-07-21 | 2026-10-19 |

---

## Platform & Tool Claims

| Topic | Claim | Source | Verified | Next Review |
| ----- | ----- | ------ | -------- | ----------- |
| — | — | — | — | — |

---

## Pending Verification

Claims included in wiki pages from corpus synthesis that have not been independently verified.

| Topic | Claim | Affects | Added | Verify Against |
| ----- | ----- | ------- | ----- | -------------- |
| aDOT stability | aDOT year-over-year correlation r ~0.65-0.70 when QB/team/role constant | average-depth-of-target | 2026-07-17 | Player tracking across multiple seasons, same QB/team |
| aDOT and fantasy | High aDOT negatively correlated with per-week fantasy scoring (2026 Dhanani study) | average-depth-of-target | 2026-07-17 | Dhanani research paper, 4961 WR-week sample 2022-2025 |
| Explosive rate stability | Explosive play rate year-over-year r ~0.25-0.35; reverts aggressively | explosive-play-rate | 2026-07-17 | Multi-season RB sample, 10+ and 15+ yard thresholds |
| MTF/YAC stability | YAC/Att r ~0.40-0.50, MTF/Att r ~0.45-0.55 year-over-year | missed-tackles-forced, yards-after-contact | 2026-07-17 | PFF multi-season dataset, minimum 100 carry sample |
| Platform variance: aDOT | PFF charted vs NGS tracked aDOT differ 0.3-0.8 yards on same player | average-depth-of-target | 2026-07-17 | Direct PFF/NGS comparison across wide receiver sample |
| Platform variance: MTF | PFF manual charting vs NGS tracking MTF differ 10-20 forced misses per season | missed-tackles-forced | 2026-07-17 | Same player, same season, PFF vs NGS credit counts |
| Explosive threshold impact | 10-yard vs 15-yard vs 20-yard thresholds produce materially different rates and rankings | explosive-play-rate | 2026-07-17 | Same player/season across threshold definitions |
| Platform variance: Catch rate | All major platforms (ESPN, Yahoo, NFL.com, PFF) use identical formula (receptions/targets); divergence is contextual (weighting, adjustments) not arithmetical | catch-rate | 2026-07-17 | Cross-platform direct comparison, 50+ high-volume WRs same season |
| Platform variance: Contested catch rate | PFF vs NGS CCR differ 3-5 percentage points same player: PFF more liberal, NGS more inclusive at 1-yard threshold. PFF considered standard. | contested-catch-rate | 2026-07-17 | Same WR sample, PFF vs NGS side-by-side CCR; SIS intermediate |
| Platform variance: Drop rate | PFF 1-3 points higher than NFL official for same player. PFF definition more liberal. Never compare across sources without disclosure. | drop-rate | 2026-07-17 | Same WRs, same season; PFF vs NFL official published rates |
| CCR sample stabilization | Contested catch rate requires 30+ contested targets to stabilize; below 15 targets is noise; 15-29 is moderate signal. | contested-catch-rate | 2026-07-17 | Sample-size analysis across NFL WR seasons 2022-2025 |
| Drop rate year-over-year | Drop rate year-over-year r² ~0.35-0.40 for WRs ≥80 targets; 12-16% skill, rest noise/QB/scheme change. | drop-rate | 2026-07-17 | PFF multi-year WR correlations; verify r² coefficient stability |
| TPG correlation with fantasy | Fantasy points per game correlation with TPG: r ~0.65-0.75 half-PPR RB, ~0.55-0.65 WR, once role established. | touches-per-game | 2026-07-17 | Multi-year, multi-player regression analysis; RB vs WR subsets |
| Catch rate QB dependence | Catch rate shifts 5-8% when QB changes from inaccurate to accurate; isolate via separation/target-depth split. | catch-rate | 2026-07-17 | Players traded mid-season, old QB vs new QB; aDOT-adjusted comparison |
| Sleeper authenticated GraphQL/WebSocket layer mechanics | Sleeper's write-capable layer (lineup moves, commissioner actions, live push) is commonly described as an authenticated GraphQL endpoint plus a companion WebSocket channel, but exact token format, session lifetime, and refresh behavior are not established with precision. | sleeper-api/authentication | 2026-07-21 | Direct API experimentation or a response from Sleeper; corroboration on the layer's existence strengthened from 2-3 of 6 (initial run, 2026-07-17) to a majority across a second, independently-scoped 6-model panel (2026-07-21) — mechanics remain unresolved across both runs. |
| Sleeper `scoring_settings` and `settings` exhaustive key inventory | No official, versioned schema exists for either object; all key inventories on `sleeper-api/league-endpoint` are reconstructed from cross-corroborated community/panel observation, not an official source. IDP leagues carry a materially larger, distinct key family. | sleeper-api/league-endpoint | 2026-07-21 | Direct sampling across a large number of real leagues spanning redraft, dynasty, best-ball, and IDP formats |
| Sleeper `starters` empty-slot placeholder value | An empty starting lineup slot is represented in `starters` by a placeholder rather than being omitted, but sources disagree on whether the placeholder is `null` or an empty-string-like sentinel. | sleeper-api/roster-endpoint, sleeper-api/matchup-endpoint | 2026-07-21 | Direct sampling against live rosters and matchup responses with intentionally empty lineup slots |
| Sleeper waiver `settings.seq` semantics | `settings.seq` on waiver transactions is community-documented as a processing-sequence index, but its exact semantics and reliability for reconstructing intra-run processing order are not officially confirmed. | sleeper-api/transactions-endpoint | 2026-07-21 | Direct observation of a live league during an active waiver run |
| Sleeper user-leagues endpoint co-manager visibility | Sources disagree on whether a co-manager (a `co_owners` entry, not the primary `owner_id`) reliably sees a shared league returned from their own `/user/{user_id}/leagues/nfl/{season}` call. | sleeper-api/user-leagues-endpoint | 2026-07-21 | Direct testing with a real co-managed league across multiple distinct user accounts |

---

## Unresolved Conflicts

Claims where sources directly contradict each other and the conflict could not be resolved within the 5-minute cap. Affected pages carry `confidence: medium` and include the conflict in Open Questions.

| Topic | Conflict | Status | Notes |
| ----- | -------- | ------ | ----- |
| Sleeper 5.1-5.3 panel scope mismatch | The original chathub.gg panel prompt for subjects 5.1 (auth), 5.2 (league endpoint), 5.3 (roster endpoint) was intended to isolate those 3 subjects, but most of the 6 returned responses answered a much broader "Sleeper + ESPN full API" scope instead. | **RESOLVED 2026-07-21** | A cleanly-scoped 3-subject panel prompt isolating 5.1-5.3 specifically was re-run on 2026-07-21; all 6 responses this time addressed the requested subjects directly and in depth. The redo reinforced every claim already on the three affected pages (no contradictions against the prior broad-scope material) and added a substantial amount of new, well-corroborated detail (see the three Statistical & Methodology Claims rows added 2026-07-21 above, and the block-level updates to `authentication.md`, `league-endpoint.md`, and `roster-endpoint.md`). Subjects 5.4-5.6 (matchup, draft, users endpoints) were run as a cleanly-scoped triple from the start on 2026-07-21 with no scope-mismatch issue — all 6 responses addressed exactly the requested subjects. Future subjects (5.7+, all of Notebook 6) should continue using cleanly-scoped single-triple prompts. |
| Sleeper `roster_positions` inclusion of `BN`/`IR`/`TAXI` | In the 2026-07-21 cleanly-scoped panel redo, 4 of 6 responses described `BN`, `IR`, and `TAXI` as literal entries within the `roster_positions` array itself (consistent with the wiki's existing page content). 2 of 6 responses instead described bench/taxi/IR capacity as living only in `settings` as counts, with `roster_positions` limited to startable slots. | Resolved via corroboration, medium-high confidence | Resolved in favor of the 4-of-6 majority per the Convergence-Filtering Standard, and consistent with the page's pre-existing content from the initial (broad-scope) session. Logged as an open question on `sleeper-api/league-endpoint` pending direct sampling against a live league response, since this affects lineup-slot parsing logic directly. |
| Sleeper matchup `custom_points` precedence formula | 5 of 6 responses for subject 5.4 treated `custom_points` as mechanically overriding `points` whenever non-null; 1 response noted more cautiously that Sleeper does not publish a formal client-side precedence contract and recommended validating against the league's displayed result before treating the override as unconditionally authoritative. | Resolved via corroboration, high confidence with one flagged caveat | Resolved in favor of the 5-of-6 majority (prefer `custom_points` when non-null) as standard practice, while retaining the single dissenting response's caution as an explicit validation step for standings-critical features on `sleeper-api/matchup-endpoint`. Not a true contradiction — the minority view is a stricter version of the same guidance, not a conflicting claim. |
| Sleeper playoff bracket reseeding | For subject 5.9, one response described winners/losers brackets as fixed at generation with no reseeding after upsets. Two other responses described a league-configurable reseeding behavior where Sleeper reassigns later-round `t1_from`/`t2_from` targets after each round completes, based on actual results rather than the original bracket structure. A fourth response described a specific "winner/loser semantic flip" in Toilet Bowl-style losers brackets that no other response corroborated. | **UNRESOLVED** | The reseeding disagreement (no-reseed vs. configurable-reseed) is a direct contradiction, not a majority/minority split with a clear resolution — 2 responses corroborate reseeding-is-possible against 1 explicit no-reseed claim, with the remaining responses silent on the question. Resolved provisionally in favor of the reseeding-possible corroboration (2-of-3 on the point) per the Convergence-Filtering Standard, but confidence is downgraded to medium on `sleeper-api/playoff-bracket-endpoint` and the conflict is logged in that page's Open Questions rather than treated as settled. The single-model "semantic flip" claim for Toilet Bowl formats was excluded entirely as an uncorroborated, fabrication-prone specific claim per the standard's guidance on single-model specificity. Needs direct empirical testing against a live reseeding-enabled league to resolve fully. |

---

_End of wiki/verification-cache.md_
