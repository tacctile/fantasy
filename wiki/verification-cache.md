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
| Sleeper read API requires no auth; no API-level private-league concept | Sleeper's public REST API (`api.sleeper.app/v1`) requires no API key, token, or OAuth for any read endpoint; consequently any league is fully readable by anyone holding its league ID, regardless of in-app privacy settings. | chathub.gg 6-model panel (subjects 5.1-5.3, though the panel run answered broadly rather than isolating the 3 subjects — see Unresolved Conflicts); 6-of-6 responses agree on the no-auth-for-reads claim. | 2026-07-21 | 2026-10-19 |
| Sleeper fpts split integer/decimal representation | Sleeper roster `settings.fpts` and `fpts_decimal` (and equivalent points-against/projected pairs) are two fields representing one decimal score, e.g. `fpts:1234` + `fpts_decimal:56` = 1234.56 points — not two independent statistics. | chathub.gg 6-model panel (subject 5.3); corroborated by 2+ independent detailed responses. | 2026-07-21 | 2026-10-19 |

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
| Sleeper authenticated GraphQL/WebSocket layer mechanics | Sleeper's write-capable layer (lineup moves, commissioner actions, live push) is commonly described as an authenticated GraphQL endpoint plus a companion WebSocket channel, but exact token format, session lifetime, and refresh behavior are not established with precision. | sleeper-api/authentication | 2026-07-21 | Direct API experimentation or a response from Sleeper; only 2-3 of 6 panel responses addressed this layer at all, with low mutual corroboration on mechanics |

---

## Unresolved Conflicts

Claims where sources directly contradict each other and the conflict could not be resolved within the 5-minute cap. Affected pages carry `confidence: medium` and include the conflict in Open Questions.

| Topic | Conflict | Status | Notes |
| ----- | -------- | ------ | ----- |
| Sleeper 5.1-5.3 panel scope mismatch | The chathub.gg panel prompt for subjects 5.1 (auth), 5.2 (league endpoint), 5.3 (roster endpoint) was intended to isolate those 3 subjects, but most of the 6 returned responses answered a much broader "Sleeper + ESPN full API" scope instead (one model explicitly noted the 3 subjects were missing from what it received). Convergence-filtering was applied only to the material actually relevant to 5.1-5.3; the remainder of each response (transactions, drafts, players endpoint, rate limits, and full ESPN API coverage) was not discarded as false, but was not synthesized into pages this session to preserve the 3-subject-per-session cadence and session-health limits. | Noted, not blocking | Future sessions for 5.4+ and all of Notebook 6 should re-run a cleanly scoped 3-subject panel prompt rather than reuse this dump, since convergence cannot be cleanly attributed per-subject across responses that answered different scopes. |

---

_End of wiki/verification-cache.md_
