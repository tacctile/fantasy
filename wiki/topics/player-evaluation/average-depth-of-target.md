---
title: "Average Depth of Target (aDOT)"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - adot
  - target-depth
  - receiving-role
  - volatility
  - efficiency
related:
  - player-evaluation/air-yards-share
  - player-evaluation/route-participation-rate
  - player-evaluation/target-share
  - player-evaluation/yards-after-catch
---

## Summary

Average depth of target (aDOT) measures the mean distance downfield from the line of scrimmage at which a receiver is targeted, encoding both the quarterback's aggression and the receiver's route-tree role. aDOT is a **role descriptor**, not a talent metric—it reveals whether a player operates in the short game, intermediate routes, or as a downfield threat, and directly influences expected weekly volatility and floor versus ceiling. Interpreting aDOT requires pairing it with target volume, route participation, and air yards share; a high aDOT with low volume is fragile, while moderate aDOT with high volume is the strongest fantasy profile.

## Core Knowledge

### Calculation and Meaning

aDOT is calculated as:

$$\text{aDOT} = \frac{\text{Total air yards on all targets}}{\text{Total targets}}$$

Air yards represent the distance from the line of scrimmage to the point where the pass arrives at the receiver—not where the receiver catches it, and including incompletions. This distinction is critical: aDOT measures where the quarterback targets the receiver, independent of whether the pass is completed or how far the receiver runs after the catch.

A target at the line of scrimmage contributes approximately 0 air yards. A target 10 yards downfield contributes 10. Behind-the-line targets (screens, shovel passes) can contribute 0 or negative values depending on provider methodology. Because aDOT is an arithmetic mean, it is sensitive to extreme values; a player targeted twice at 2 yards and 22 yards has an aDOT of 12 yards, identical to a player targeted twice at 12 yards, despite entirely different usage profiles.

### What aDOT Reveals About Role

aDOT encodes the intersection of three factors: the receiver's assigned route depth, the quarterback's willingness to throw deep, and the receiving role's design. A player with high aDOT (typically 10+ yards) operates primarily on intermediate-to-deep routes. This profile correlates with:

- Lower completion percentage (deeper targets are harder to complete)
- Higher yards per reception when caught (more yardage opportunity per target)
- Greater week-to-week variance (fewer, higher-leverage targets)
- Higher touchdown ceiling (deep targets create end-zone opportunity)
- Lower reception floor and more volatility in PPR scoring

A player with low aDOT (typically under 6 yards) operates primarily in the short game—slot, option routes, manufactured touches, screens. This profile correlates with:

- Higher completion percentage (easier targets)
- More receptions and more stable weekly reception totals (PPR friendly)
- Lower yards-per-reception ceiling (limited opportunity per catch)
- Dependence on yards after catch (YAC) for efficiency gains
- More predictable weekly floors but lower upside

Intermediate aDOT (roughly 7–9 yards) represents a hybrid role with balanced route trees. Empirically, this range often produces the most consistent fantasy production because it combines reasonable target volume with modest efficiency expectations.

### Platform and Provider Differences

aDOT is not an official NFL statistic. It is derived from charting or tracking data, and different analytics providers measure it differently:

**Charting-based providers** (Pro Football Focus, Sports Info Solutions) rely on manual film review to locate each target. They use consistent criteria for classifying plays (throwaways, spikes, screen passes) but introduce subjective judgment on borderline calls (lateral-edge passes, jet-sweep motion reads). Their aDOT for the same player can vary from official tracking-based aDOT by 0.3–0.8 yards, particularly on routes in the 10–15 yard range where human estimation is less precise.

**Tracking-based providers** (NFL Next Gen Stats) use RFID ball-tracking and player-location data to calculate target depth at the exact moment of the pass. This is more precise on flight distance and catch-point location but does not automatically resolve classification ambiguity (is a screen pass 0 yards or negative?).

**Secondary aggregators** (PlayerProfiler, FantasyPros, projection systems) license data from one primary source and republish it. They may introduce additional filters or exclude certain play types, causing minor discrepancies.

**Common source-related discrepancies:**
- Treatment of behind-the-line passes (screens, jet sweeps): some providers assign 0 or negative air yards; others exclude them entirely
- Throwaway and spike classification: some include the receiver closest to the intended target; others exclude the play
- Lateral and backward passes: charting rules vary on whether these count as "passing" targets
- Interceptions and defensive pass interference: inclusion rules differ

For any given player, aDOT values may differ by 0.5–1.5 yards depending on provider, particularly for slot receivers with high screen usage. **Always note the data source when comparing players across platforms.**

### Stabilization and Sample Size

aDOT requires meaningful targets to stabilize as a reliable role descriptor. Empirically:

- **30–40 targets** is the minimum threshold for preliminary role inference
- **50+ targets** provides reasonable confidence in the measured role
- Below 30 targets, single deep shots or a concentration of short targets can shift aDOT significantly, introducing noise

A receiver with 10 targets and two of them being 25-yard attempts will show a higher aDOT than the season-long role warrants. Early-season evaluations are particularly vulnerable to this distortion.

Year-over-year aDOT stability is strong when the quarterback, offensive coordinator, and receiver role remain constant (r ~0.65–0.70), but degrades sharply when any of these change. A quarterback transition, coordinator change, or shift in receiver position can alter aDOT by 20–30% even when the receiver's assigned routes remain nominally the same.

### Quarterback and Scheme Dependence

aDOT is not independent of quarterback play. The same receiver can show different aDOT under different quarterbacks due to:

- **Quarterback arm talent and accuracy:** A deep-ball specialist quarterback (e.g., Josh Allen) will elevate a receiver's aDOT compared to a check-down specialist (e.g., late-career Ryan Tannehill)
- **Offensive strategy:** Vertical-scheme quarterbacks (high-tempo, play-action emphasis) produce higher team aDOT; short-area and 2-minute drill specialists produce lower aDOT
- **Protection quality and quarterback decision-making:** Pressure can force earlier, shorter throws; clean pockets enable deeper reads
- **Game script:** Trailing teams throw more short-area passes; leading teams may use more deep-shot play-action

A receiver's aDOT should be contextualized within the quarterback's season-long aDOT and the offense's air-yards distribution, not interpreted as a pure signal of receiver role.

### Relationship to Fantasy Production

The relationship between aDOT and fantasy scoring is counterintuitive. **Higher aDOT does not directly predict higher fantasy points.** The mechanism is:

- Deep-route players earn targets at lower frequency (roughly 12–14% of routes run, vs. 25–27% for short-area routes)
- Deep targets produce more yards per reception, but incompletions reduce weekly production
- Net effect: a high-volume shallow-route player (high targets, high catch rate) often produces more consistent weekly fantasy points than a deep-route specialist with lower volume

This does not mean deep threats are valueless. Per-target value is higher for deep routes (more yards, more touchdown equity). But fantasy scoring is per-game, not per-target, making volume the dominant factor in most formats.

## Key Decisions

**The platform will treat aDOT as a role-classification metric, not a talent-quality metric.** aDOT exists to answer: "Where in the field is this receiver used?" It does not answer: "Is this receiver talented?"

**The platform will require aDOT to be paired with target share and route participation in any evaluation or projection.** aDOT alone is insufficient for opportunity modeling. The combination of targets, route participation, and aDOT establishes both the receiver's role and the consistency of that role.

**The platform will use aDOT to identify likely weekly variance profiles.** High aDOT with moderate volume = higher ceiling, lower floor. Low aDOT with high volume = higher floor, more predictable ceiling. Intermediate aDOT with high volume = balanced upside.

**The platform will prioritize air-yards share over raw aDOT for projection, when available.** Air-yards share (a player's air yards as a percentage of team air yards) is more stable year-over-year than raw aDOT and better insulated from small-sample noise. When charting or tracking data includes air-yards share, prefer it over aDOT for forecasting.

**The platform will downgrade confidence in aDOT-based evaluation after quarterback changes, offensive coordinator changes, or significant role shifts in the same season.** aDOT is scheme and quarterback-dependent. Changes to these inputs warrant re-anchoring to recent data, not relying on prior-season baselines.

## Open Questions

- **Optimal aDOT range for fantasy production:** Preliminary evidence suggests moderate-shallow aDOT (~7–11 yards) maximizes consistent weekly production, but this may vary by PPR/half-PPR/standard scoring and league format. The extremes (very shallow screens vs. pure deep threats) are less studied.
- **Stability of aDOT under complete coaching-staff carnage:** Most stability studies assume quarterback or coordinator change. Full offensive staff overhauls have not been systematically evaluated for their impact on aDOT reversion.
- **Interaction of aDOT with receiving context:** A high-aDOT receiver may be more or less valuable depending on offensive pace, play-action frequency, and safety-help tendencies. How to weight these interactions for projection is open.
- **Optimal provider and charting methodology:** Tracking-based aDOT (NGS) may eventually be more predictive than film-charted versions (PFF), but no comparative predictive study has been published.

---

_End of average-depth-of-target.md_
