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

---

## Unresolved Conflicts

Claims where sources directly contradict each other and the conflict could not be resolved within the 5-minute cap. Affected pages carry `confidence: medium` and include the conflict in Open Questions.

| Topic | Conflict | Status | Notes |
| ----- | -------- | ------ | ----- |
| — | — | — | — |

---

_End of wiki/verification-cache.md_
