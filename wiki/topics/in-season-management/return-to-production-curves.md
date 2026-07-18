---
title: "Return-to-Production Curves — Modeling Post-Injury Performance as a Curve, Not a Binary"
type: domain-knowledge
category: in-season-management
status: active
last_updated: "2026-07-18"
confidence: medium
tags:
  - recovery-timeline
  - return-to-production
  - snap-trend
  - target-trend
  - role-change
  - volatility
  - injury-status
related:
  - in-season-management/injury-type-recovery-timelines
  - in-season-management/weekly-start-sit-projections
  - in-season-management/rest-of-season-rankings
---

## Summary

Post-injury fantasy production follows a curve, not a binary "healthy or not" switch, and every sampled model converges on the same central correction: return to the lineup is not return to fantasy value, and a manager must separately track role recovery (snaps, routes, carries, targets, red-zone opportunity — directly observable) from efficiency recovery (separation, explosiveness, contact tolerance, scramble willingness — noisier and slower to normalize). Role typically recovers before efficiency for injuries affecting acceleration, cutting, or contact tolerance, meaning a player can look statistically "back" through normal-looking volume while still producing below his established baseline on a per-touch or per-route basis. The first game back is consistently flagged across sources as an unreliable single-game sample, contaminated by touchdown variance, conservative play-calling, and matchup effects, with most sources converging that a multi-game window (roughly two to three games at minimum) is needed before treating post-return production as a stable signal.

## Core Knowledge

### Decompose production into role recovery and efficiency recovery as separate variables

The single most load-bearing modeling correction, converged on by every source, is that post-injury fantasy production should not be modeled as one combined recovery percentage. Role (snap share, route participation, carry share, target share, red-zone/goal-line usage) is directly observable and typically the first component to normalize, because coaches can and do restore volume once a player is medically cleared even before that player has regained full explosiveness. Efficiency (separation, yards after contact, explosive-play rate, missed-tackles-forced, scramble rate for quarterbacks) is noisier, slower to normalize, and directly tied to the specific physical capacity the injury affected. A player can therefore show a normal-looking snap count or touch total while still producing meaningfully below his pre-injury per-touch or per-route baseline — a pattern sources describe as far more common than the reverse (constrained role with normal per-touch efficiency).

### The common post-return shape has four phases

Sources converge on a recurring structural pattern: a re-entry phase with constrained and protected role and high game-to-game variance; a usage-normalization phase where routes, carries, or targets rise before efficiency does; an efficiency-catch-up phase where burst, timing, and contact tolerance gradually improve; and, for some injury types, a residual-drag phase where full efficiency normalization does not occur within the same season. The curve is not strictly monotonic — a player can post a strong first game due to a favorable matchup or touchdown variance and then decline once exposed to a normal workload, or conversely post a cautious, muted first game followed by a rapid role increase in subsequent weeks. Because of this non-monotonic pattern, a single data point immediately following return should not be extrapolated into a trend in either direction.

### Injury-type-specific suppression windows

Sources converge directionally, though not on precise week counts, that suppression duration and shape differ meaningfully by injury type. ACL reconstruction carries the widest and longest suppression window, with the greatest uncertainty concentrated in the first several games of the returning season and — per some sources — snap share and touch-efficiency both running measurably below baseline through that period, with true normalization sometimes not occurring until the following season. Hamstring strains produce a shorter but more bimodal pattern: either relatively rapid normalization within the first few games, or a recurrence/re-aggravation event that resets the clock — sources converge this bimodal framing is more useful for planning purposes than assuming a smooth linear recovery. High ankle sprains commonly produce suppressed efficiency that outlasts the suppressed role — snaps and touches can look normal while yards-per-touch, separation, or yards-per-route remain below baseline for an extended window. MCL sprains, when isolated and lower-grade, tend to have the shortest suppression window of the four, typically concentrated in the first game or two back, with higher-grade or associated injuries extending this materially.

### Position-specific recovery trajectories

**Running backs** show the slowest and most volume-sensitive rebound among the four positions. Receiving work frequently returns before rushing explosion and contact-balance metrics normalize, and a nominally healthy back returning to a full workload can still underperform his established per-touch baseline for several games. The presence and performance of the replacement back during the absence is a meaningfully important confound: a well-performing committee partner can suppress the returning back's role even after he is physically ready, independent of any injury effect.

**Wide receivers** are more route-sensitive than snap-sensitive after return — a player can retain a normal or near-normal snap share while running a reduced share of high-value routes (deep, vertical, or sharp-cut concepts) relative to short, low-explosiveness routes. Target share can rebound quickly if the player remains central to the offense, but route depth and separation-dependent production frequently lag. Possession-style receivers tend to rebound more cleanly and predictably than field-stretching or separation-dependent receivers, because their value depends less on the specific physical capacity most injuries affect.

**Tight ends** are frequently the most forgiving pass-catching position to project post-injury, because many tight ends can sustain value on short and seam routes without requiring full-speed separation ability. However, if the injury affects blocking capacity or leverage, snap share specifically in blocking-heavy personnel packages can remain capped even as receiving routes normalize — meaning route share, not raw snap share, is the more informative post-return signal for tight ends.

**Quarterbacks** show the clearest split between pocket-based and rushing-based value. A pocket passer recovering from a lower-body injury frequently preserves passing volume and efficiency with comparatively little fantasy impact once medically cleared. A mobile quarterback shows a materially larger and more persistent post-return decline because designed runs, scramble volume, and pressure-avoidance movement are separately and specifically affected, and teams often continue restricting these concepts for a period even after full passing-game clearance — producing a pattern where passing-game output appears normal while a meaningful rushing-floor component remains suppressed.

### Known failure patterns and pitfalls

Sources converge on several recurring analytical traps. The first-game-back sample is unreliable in isolation because it combines uncertain workload, matchup effects, game script, touchdown variance, and deliberately conservative route or play selection — a multi-game rolling window of roughly two to three games is the converged minimum before treating post-return data as stable signal. Touchdown-driven box scores create false positives and false negatives: a player can score well on clearly limited underlying work, or perform efficiently on the underlying metrics while failing to find the end zone, making touchdown-inclusive fantasy points a poor standalone indicator of true recovery status; expected-fantasy-points or opportunity-based metrics are better suited to isolating the underlying trend. An active-but-limited designation does not guarantee normal role — a player can be technically active while functioning in a reduced or situational capacity, and volume alone (without route-quality or touch-quality context) can conceal this. The replacement effect is a persistent confound, particularly for running backs and tight ends: a returning player may be physically ready but still lose role to a teammate who performed well during the absence. Team-level confounds — a coaching change, offensive-line shift, new quarterback, or schedule change — can dominate or mask the apparent injury effect and should be checked before attributing a production change to the injury itself.

## Key Decisions

The platform will model post-injury production as two separately tracked components — role recovery and efficiency recovery — rather than a single combined recovery percentage, because every sampled source independently converges that role typically normalizes before efficiency for injuries affecting acceleration, cutting, or contact tolerance, and that collapsing the two into one figure obscures the more common and more fantasy-relevant failure mode (normal volume, suppressed per-touch production).

The platform will require a minimum multi-game rolling window (approximately two to three games) before treating post-return production data as a stable trend, and will explicitly flag first-game-back performance as low-confidence signal, because sources converge the first game back is disproportionately contaminated by matchup, game-script, and touchdown variance relative to its information value.

The platform will prioritize route-share, snap-share, and touch-share trend data over box-score fantasy points when assessing post-return trajectory, and will surface expected-fantasy-points or opportunity-based metrics alongside raw output, because sources converge that touchdown-inclusive box scores produce both false positives and false negatives about underlying recovery status.

The platform will apply position-specific and archetype-specific post-return discount curves — steepest and most volume-sensitive for running backs, route-quality-sensitive rather than snap-sensitive for wide receivers and tight ends, and split into separate passing and rushing components for quarterbacks — rather than a single positional discount, because sources converge these positions and archetypes recover along materially different dimensions.

The platform will incorporate the replacement player's performance during a starter's absence as an explicit input to post-return role projection, rather than assuming automatic role restoration upon a starter's activation, because sources converge that a well-performing replacement is a meaningful and common cause of role suppression independent of the returning player's physical readiness.

## Open Questions

- [ ] Exact suppression-window durations by injury type and position are directionally consistent but numerically inconsistent across sources — flagged for calibration against the platform's own historical post-return outcome data.
- [ ] Whether publicly available tracking-derived metrics (acceleration, separation, max velocity) can reliably distinguish incomplete physical recovery from deliberate role management before fantasy production visibly declines is raised as an open tension without corroborated resolution.
- [ ] The degree to which post-return suppression reflects genuine physical limitation versus deliberate coaching-staff workload management is repeatedly raised as difficult to disentangle from public data alone.
