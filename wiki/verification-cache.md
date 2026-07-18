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

---

## Unresolved Conflicts

Claims where sources directly contradict each other and the conflict could not be resolved within the 5-minute cap. Affected pages carry `confidence: medium` and include the conflict in Open Questions.

| Topic | Conflict | Status | Notes |
| ----- | -------- | ------ | ----- |
| — | — | — | — |

---

_End of wiki/verification-cache.md_
