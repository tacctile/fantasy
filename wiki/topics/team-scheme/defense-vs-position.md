---
title: "Defense vs. Position (DvP)"
type: domain-knowledge
category: team-scheme
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - dvp
  - defense-efficiency
  - target-distribution
  - red-zone
  - goal-line
  - game-script
  - epa
  - implied-team-total
related:
  - team-scheme/opponent-defense-efficiency-epa-dvoa
  - team-scheme/vegas-implied-team-total
  - team-scheme/red-zone-efficiency-team
  - player-evaluation/red-zone-target-share
  - player-evaluation/goal-line-carry-share
---

## Summary

Defense vs. Position (DvP) measures fantasy points a defense has allowed to a specific offensive position, and every model in this synthesis converges on the same core finding: raw DvP is a noisy, format-dependent descriptive statistic that conflates opponent talent faced, touchdown variance, game script, and offensive volume with actual defensive skill — it is not a reliable standalone predictor. DvP becomes genuinely useful only when decomposed into volume-allowed, efficiency-allowed, and scoring-environment components, adjusted for opponent quality, and read at a finer role/alignment granularity (slot vs. perimeter receiver, rushing vs. receiving running back) than a single blended positional number.

## Core Knowledge

### Core Calculation and What It Actually Bundles

$$\text{Raw DvP} = \frac{\text{Total Fantasy Points Allowed to Position}}{\text{Games Played}}$$

This raw figure is entirely dependent on the specific league scoring system in use (standard, half-PPR, full-PPR, TE premium, 4-vs-6-point passing touchdowns) — the same defensive performance produces different DvP rankings under different scoring rules, and a tool that does not disclose its scoring basis introduces an unstated source of error. "Fantasy points allowed to position" typically bundles multiple distinct offensive events into one number: for a quarterback, this means passing production, rushing production, and turnovers are combined, even though a defense can be simultaneously strong against the pass and weak against a mobile quarterback's scrambling and designed-run production, or vice versa. For running backs, some platforms combine rushing and receiving production into one figure while others separate them — a distinction that matters enormously in PPR formats, since a defense can be genuinely strong against inside-zone rushing while being a soft matchup for pass-catching backs specifically.

### Decomposing DvP: Volume, Efficiency, and Scoring Environment

The strongest, most consistently corroborated framework across responses breaks DvP into three separable components rather than treating it as one number:

- **Volume allowed** — targets, carries, and red-zone touches allowed to a position per game, which answers whether a defense structurally funnels usage toward or away from a position (e.g., a two-high safety shell may suppress perimeter receiver volume while inviting underneath running-back and tight-end targets).
- **Efficiency allowed** — fantasy points per target or per carry allowed, isolating whether the defense permits high-value production on a per-opportunity basis rather than simply facing high opportunity volume.
- **Scoring environment** — the opponent offense's own play volume, pace, and touchdown-scoring context, since a defense can be genuinely below-average per play while still posting a strong DvP number because its own offense creates a slow, low-total game script.

Fantasy points per target and per carry allowed are calculated as:

$$\text{Fantasy Points per Target Allowed} = \frac{\text{Fantasy Points Allowed on Targets to Position}}{\text{Targets Allowed to Position}}$$

$$\text{Fantasy Points per Carry Allowed} = \frac{\text{Fantasy Points Allowed on Carries to Position}}{\text{Carries Allowed to Position}}$$

### Adjusted DvP: Correcting for Opponent Quality

Because raw DvP reflects who a defense has faced as much as how well it defended, schedule- or opponent-adjusted DvP is consistently identified as superior to the raw figure:

$$\text{Adjusted DvP} = \text{Actual Fantasy Points Allowed} - \text{Expected Fantasy Points Allowed (based on opponent quality)}$$

A defense that has faced a run of elite quarterbacks or top-tier receiving corps will show an inflated (worse-looking) raw DvP even if its performance was average or better relative to the difficulty of what it faced; the reverse is equally true for a defense that has faced a run of backup quarterbacks or depleted receiving rooms. The practical question adjusted DvP answers is not "how many points has this defense allowed," but "does this defense cause players at this position to score more or less than their baseline."

### Role- and Alignment-Specific Granularity

A single blended positional DvP number is repeatedly identified as too coarse to be reliably actionable. The more predictive framing splits by functional role or alignment:

- **Wide receivers** — slot vs. perimeter alignment DvP, since a defense can shut down boundary receivers while remaining exploitable against slot receivers (or vice versa), and a blended WR DvP number averages these into a misleadingly neutral reading.
- **Running backs** — rushing DvP and receiving DvP tracked separately, since a defense can be strong against between-the-tackles rushing while being a soft matchup specifically for pass-catching backs, a distinction invisible in a combined RB DvP figure.
- **Tight ends** — route participation and target share allowed specifically to the position, since tight end scoring is low-volume and disproportionately touchdown-driven, making raw points-allowed especially noisy at this position.
- **Quarterbacks** — passing fantasy points allowed and rushing fantasy points allowed tracked as separate figures, since a defense can be strong against the pass while being specifically vulnerable to quarterback scrambling and designed runs (a critical distinction for mobile-quarterback matchups).

### Time Window and Recency

Common DvP windows include full-season average, last 3-6 games, and home/road splits. Full-season aggregates are more stable but can mask a defense's current state after a significant injury, coordinator change, or personnel shift; short recent windows are more responsive to real change but are also more vulnerable to small-sample noise from one or two outlier games. The consistent guidance across responses is to weight recent data (commonly a 4-6 game window) more heavily once a season reaches roughly Week 5-6, but only to treat a recent-window shift as meaningful when it is corroborated by an identifiable cause — a personnel change, injury, or scheme shift — rather than as an unexplained statistical blip.

### Platform and Provider Differences

- **Mainstream fantasy platforms** (ESPN, Yahoo, CBS, NFL Fantasy, Sleeper) generally present raw, unadjusted fantasy points allowed by position, often as a simple rank or color-coded matchup rating, with limited or no opponent-strength adjustment and inconsistent disclosure of the underlying scoring format.
- **Aggregator and analytics-oriented platforms** (FantasyPros, RotoViz, Footballguys, numberFire) more commonly publish an adjusted or schedule-corrected version of fantasy points allowed, explicitly comparing observed production against the opponents' typical output elsewhere, which more directly isolates defensive skill from schedule difficulty.
- **Charting- and grading-based providers** (PFF and similar) generally do not frame their primary matchup product as DvP at all, instead offering role- and alignment-specific matchup data (slot-versus-slot-corner performance, tight-end-versus-coverage-type performance, receiver-versus-specific-cornerback grades) that is more granular than any position-level DvP figure.
- **No platform's exact adjustment formula is standardized or fully public** — schedule-adjustment methodology, denominator construction (whether running back receiving production is folded into or separated from rushing DvP), and treatment of touchdown-heavy outlier games all vary across providers without a common convention.

### Edge Cases, Failure Patterns, and Pitfalls

- **Schedule dependence is the central and most repeated failure mode.** Raw DvP measures who a defense faced at least as much as how well it defended; this is the single most consistently flagged weakness across all responses.
- **Touchdown variance dominates small samples.** Fantasy scoring, particularly at tight end and in DST evaluation, is disproportionately touchdown-dependent, and touchdowns are high-variance, low-frequency events. A defense can appear to be a poor matchup for a position after allowing a small number of touchdowns on otherwise unremarkable volume, producing a misleading signal from a handful of plays.
- **Game script and offensive-context contamination.** A defense whose own offense is weak or slow may force opponents into a run-heavy, clock-controlling game plan that suppresses passing-position DvP not because the pass defense is strong, but because the defense rarely faces high pass volume; the same defense might show elevated running-back DvP for the identical reason. Volume allowed and per-play efficiency must be separated to avoid this confound.
- **Mobile-quarterback contamination of QB DvP.** Since quarterback fantasy scoring combines passing and rushing production, a defense that is genuinely strong against the pass but weak against scrambling or designed quarterback runs will show a misleadingly poor overall QB DvP, and the reverse pattern is equally common.
- **Position and role misclassification.** Hybrid players (pass-catching running backs, big-slot tight ends, gadget players) can have their production attributed inconsistently across providers, and a player's classification can itself shift during a season, introducing noise into both historical and current DvP figures.
- **Injury and personnel-driven staleness.** A full-season DvP figure describes a defense that may no longer exist in its current form by the time it is used — a lost starting cornerback, edge rusher, or interior defensive lineman, or a coordinator/scheme change, can invalidate several weeks of prior data essentially overnight.
- **Double-counting risk.** DvP, EPA/DVOA, Vegas implied total, pace, and red-zone rate all partially reflect the same underlying game-environment signal. Using multiple of these inputs without recognizing their shared causes risks over-weighting a single real signal by treating it as several independent confirmations.

## Key Decisions

- **Decision:** The platform will compute and surface adjusted (opponent-quality-corrected) DvP as the default view, with raw unadjusted DvP available only as a secondary, explicitly labeled figure.
  **Reasoning:** Every model identifies schedule dependence — a defense's DvP reflecting who it has faced more than how well it has defended — as the dominant and most consistently repeated failure mode of this metric.
  **Rejected alternative:** Surfacing only raw fantasy points allowed by position was rejected because it is the pattern most consistently identified across responses as producing false signals, particularly for defenses with unusually easy or difficult positional schedules.

- **Decision:** The platform will decompose DvP into volume-allowed, efficiency-allowed, and scoring-environment components rather than presenting a single blended points-allowed figure, and will additionally split relevant positions by role or alignment (RB rushing vs. receiving; WR slot vs. perimeter; QB passing vs. rushing).
  **Reasoning:** A single blended number cannot distinguish a defense that funnels volume toward a position from one that permits high per-play efficiency, nor can it separate a defense's true pass-coverage quality from its vulnerability to quarterback scrambling; this decomposition is repeatedly identified as necessary for the metric to be actionable.
  **Rejected alternative:** Displaying only a single aggregate positional DvP figure was rejected as too coarse to support reliable start/sit decisions, per the consistent guidance across responses that role-specific splits meaningfully outperform blended position labels.

- **Decision:** The platform will explicitly disclose the scoring format basis for any displayed DvP figure and will compute it against the user's actual league scoring settings rather than a fixed default.
  **Reasoning:** The same defensive performance produces materially different DvP rankings across standard, half-PPR, full-PPR, and premium-scoring formats, and an undisclosed or mismatched scoring basis introduces a hidden, avoidable source of error.
  **Rejected alternative:** Using a single fixed default scoring system regardless of the user's actual league settings was rejected because it can produce a DvP ranking that meaningfully diverges from the ranking relevant to the user's actual scoring rules.

- **Decision:** The platform will rank DvP below player role/volume, Vegas implied team total, and opponent EPA/DVOA in its internal matchup-weighting hierarchy, treating it as a confirming or tie-breaking signal rather than a primary input.
  **Reasoning:** Every model that addresses metric hierarchy places DvP at or near the bottom relative to role security, team scoring environment, and play-level defensive efficiency, since DvP is the most schedule-contaminated and touchdown-variance-prone of the available signals.
  **Rejected alternative:** Weighting DvP equally with EPA/DVOA and implied team total was rejected because it would overweight the noisiest and least opponent-adjusted of the three signal families relative to its actual demonstrated reliability.

## Open Questions

- [ ] What is the minimum sample size (in games or underlying plays) at which a position-specific DvP figure becomes stable enough to trust over a season-long baseline? — needs a formal stabilization-point analysis; responses suggest roughly 6-8 games as a rough threshold but do not agree on an exact figure.
- [ ] How much residual predictive value does DvP retain once Vegas implied team total and player props are already incorporated into a projection? — flagged across multiple responses as a genuinely open and practically important question, since betting markets may already price much of what DvP is trying to measure.
- [ ] Is there a reliable public method for separating scheme-driven defensive outcomes (a coverage shell or blitz-package choice) from personnel-talent-driven outcomes within a DvP figure? — identified as unresolved; current models cannot cleanly attribute observed points-allowed to scheme versus talent.
