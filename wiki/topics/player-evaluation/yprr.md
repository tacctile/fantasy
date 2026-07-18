---
title: "Yards Per Route Run (YPRR)"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - yprr
  - route-participation
  - target-share
  - adot
  - yac
related:
  - player-evaluation/route-participation-rate
  - player-evaluation/target-share
  - player-evaluation/air-yards-share
---

## Summary

Yards Per Route Run (YPRR) is receiving yards divided by routes run — a pure efficiency metric that measures production conditional on actually running a route, independent of snap share or target volume. It decomposes into target rate (targets ÷ routes) multiplied by yards per target, meaning identical YPRR values can describe very different player profiles: a high-volume target earner versus a low-volume big-play specialist. League-wide bands are well established — roughly 1.6–1.9 is average for full-time receivers, 2.0–2.5 is high-end WR2/borderline WR1 territory, and 2.5+ marks elite efficiency — but the metric is unstable below approximately 150–200 routes and must always be paired with route participation and target rate to be interpreted correctly.

---

## Core Knowledge

### Definition and Calculation

YPRR equals receiving yards divided by routes run, where a route is credited any time a player releases into a pass pattern regardless of whether they are targeted — this excludes pure blocking snaps and kneel-downs. Because the denominator is routes rather than targets or team snaps, YPRR isolates a player's per-opportunity production from both offensive play-calling volume and the player's own target-earning rate.

The metric decomposes two ways, both useful for diagnosis:
- **YPRR = Target Rate × Yards per Target**, where Target Rate = Targets ÷ Routes Run.
- **YPRR = Target Rate × Catch Rate × Yards per Reception.**

These decompositions matter because the same headline YPRR can be produced by fundamentally different players: a high-target-rate, moderate-efficiency possession receiver; a low-target-rate deep threat with high yards-per-target; a short-area receiver generating volume through separation and catch rate; or a player whose number is inflated by one or two explosive plays in a small sample. YPRR should never be read as a single undifferentiated number without checking which of these patterns produced it.

### League Benchmarks

Converged thresholds for wide receivers with meaningful volume:
- Below 1.30: replacement-level efficiency
- 1.30–1.60: below-average, volume-dependent
- 1.60–2.00: solid WR3/FLEX-caliber efficiency
- 2.00–2.50: high-end WR2, borderline WR1
- 2.50+: elite, typically WR1-tier
- 3.00+: outlier-season territory, frequently unsustainable

Tight ends run lower: above 1.50 with meaningful volume is strong, above 2.00 is elite. Running backs rarely exceed 1.20 on a season-long sample. These bands carry strong multi-source convergence, though exact cutoff values vary slightly source to source and should be treated as directional bands, not precise breakpoints.

### Platform Methodology Differences

The primary source of cross-platform disagreement is not the formula but the route-counting methodology — specifically, what counts as a "route run." Charting-based providers (PFF-style) rely on human/film judgment about whether a player ran a legitimate route versus a chip-release, blocking assignment, or decoy. Tracking-based providers (Next Gen Stats-style) use positional/movement data and tend to credit a route on any forward release past the line of scrimmage that isn't pass-blocking, which typically produces a larger route count than charting-based methods — and therefore a lower YPRR for the same receiving yardage. Providers also disagree on treatment of penalty-nullified plays, quarterback scrambles and broken plays, screens, and motion/jet-sweep decoys. The practical consequence: a YPRR figure is only safely comparable to another YPRR figure computed by the same provider under the same methodology. Cross-provider comparisons should be treated as directional, not precise.

### Known Pitfalls and Failure Patterns

**Small-sample instability.** YPRR is highly volatile below roughly 150–200 routes (approximately 6–8 games of full-time usage). A single long reception can swing the rate dramatically — a receiver may post an inflated YPRR over a handful of games driven by one or two broken coverages, then regress once given full-time volume. Any early-season or part-time-sample YPRR should be discounted accordingly, and season-over-season or multi-season averages are more trustworthy than single-season snapshots for players with limited route totals.

**Screen and short-area inflation.** A receiver whose route mix is heavy on screens, quick outs, and other guaranteed-positive-gain concepts will post a higher YPRR than a downfield receiver with the same underlying talent, because YPRR does not adjust for target depth. Comparing YPRR across receivers with very different route trees — even on the same team — can be misleading without also examining average depth of target or air yards per route run.

**Quarterback and offensive-environment dependence.** YPRR is heavily influenced by quarterback accuracy, protection quality, play design, and route timing, not just receiver skill. A receiver's YPRR can decline after a quarterback change even with no change in underlying route quality, and is systematically inflated or suppressed by the surrounding passing environment. This makes YPRR reasonably sticky within a stable offensive system but noisy when projecting a player moving to a new team or quarterback situation.

**YAC versus route-running conflation.** YPRR does not distinguish yards earned through separation and catch-point skill (better captured by air yards per route run) from yards after catch. Two receivers can post an identical YPRR while deriving it from opposite skill profiles — one from route-running and contested-catch ability, the other from run-after-catch ability — and those two profiles carry different persistence and translate differently to new offensive schemes.

**Role and position contamination.** Comparing YPRR across receivers with very different roles — a downfield perimeter receiver, a blocking-heavy tight end, a running back used primarily on checkdowns — without role adjustment produces misleading conclusions, since only route opportunities (not blocking snaps) enter the denominator, and route depth/target quality varies structurally by role.

**Target-priority independence.** A route is an opportunity, not a guarantee of being the intended target. A receiver can run routes on nearly every dropback and still post a modest YPRR because of low progression priority, being used as a clear-out option, facing constant double coverage, or operating in a low-value route area. Low YPRR does not automatically indicate poor receiving ability — it can reflect role rather than skill.

### Pairing with Other Metrics

YPRR is strongest as one input in a two-axis opportunity/efficiency framework, not as a standalone talent grade: pair route participation and target rate (opportunity) against YPRR and yards per target (efficiency). This distinguishes four player archetypes — high opportunity/high efficiency (foundational assets), high opportunity/low efficiency (volume-dependent), low opportunity/high efficiency (breakout candidates or role-limited specialists), and low opportunity/low efficiency (weak profiles absent a usage change). Targets Per Route Run (TPRR) should always be read alongside YPRR: YPRR shows what a receiver does once targeted, TPRR shows how often they get targeted, and the two together are far more informative than either alone.

---

## Key Decisions

- **Decision:** The platform will not display raw YPRR without also surfacing route count and a minimum-sample flag.
  **Reasoning:** YPRR is dangerously noisy below roughly 150–200 routes, and an unflagged small-sample value risks presenting statistical noise as a stable skill signal to users making roster decisions.
  **Rejected alternative:** Suppressing YPRR entirely below the sample threshold was rejected because even noisy early-season YPRR carries some directional value for engaged users, provided it's clearly labeled as low-confidence.

- **Decision:** The platform will surface YPRR alongside Targets Per Route Run (TPRR) as a paired stat, not as a standalone leaderboard metric.
  **Reasoning:** YPRR alone conflates target-earning ability with per-target efficiency; pairing it with TPRR lets users distinguish volume-driven production from true efficiency, consistent with strong convergence across sources that this pairing is the single most actionable practice for the metric.
  **Rejected alternative:** A blended single-number "receiver efficiency score" combining YPRR and TPRR into one output was rejected because it would re-introduce the same archetype-masking problem WOPR has, and no source provides a validated formula for such a composite.

- **Decision:** The platform will not attempt cross-provider YPRR normalization (e.g., converting a PFF-sourced figure to an NGS-equivalent figure).
  **Reasoning:** Methodology differences in route-counting are not a fixed, well-documented offset — sources report differing magnitudes and directions of disagreement — so any normalization the platform invented would fabricate false precision.
  **Rejected alternative:** Publishing a fixed conversion factor between provider methodologies was rejected as unsupported by available evidence; the platform will instead commit to one consistent internal route-counting methodology and avoid cross-provider comparison claims.

---

## Open Questions

- [ ] Does year-over-year YPRR stability hold up once route volume, depth of target, and coverage type are statistically controlled for? — one source cited a specific low year-over-year R² figure, but this was not independently corroborated by the other five responses and should be verified via the platform's own backtesting once historical data is available rather than taken as settled.
- [ ] Should the platform build a formation/alignment-adjusted YPRR baseline (e.g., separate expectations for slot vs. outside alignment)? — only one source provided specific numeric baselines for this adjustment; the concept has merit but the exact figures are unverified and should not be treated as authoritative without independent confirmation.
- [ ] What is the right way to decompose YPRR into air-yards-per-route and YAC-per-route components for the platform's own player pages? — sources agree this decomposition is theoretically superior but note it is rarely done systematically due to data-access constraints; needs a decision once the platform's data pipeline supports it.
