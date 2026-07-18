---
title: "Contested Catch Rate"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - catch-rate
  - efficiency
  - receiving-role
  - platform-variance
  - red-zone
related:
  - player-evaluation/catch-rate
  - player-evaluation/average-depth-of-target
  - player-evaluation/separation
  - player-evaluation/drop-rate
---

## Summary

Contested catch rate (CCR) measures a receiver's conversion rate on targets where a defender is within close proximity at the catch point, isolating performance under pressure. CCR requires a minimum 30 contested targets to stabilize; samples below this threshold are high-variance noise. CCR is a supporting diagnostic of high-difficulty performance and red-zone utility, not a standalone projection metric. Provider definitions vary significantly (PFF charting vs. NGS tracking vs. SIS evaluation), making cross-source comparison unreliable.

## Core Knowledge

### Mechanics and Calculation

$$\text{Contested Catch Rate} = \frac{\text{Contested Receptions}}{\text{Contested Targets}} \times 100\%$$

A contested target is one where a defender is in close proximity to the receiver at the catch point, creating a challenging catch scenario. The exact definition varies by provider (see Platform Differences below).

Contested catch rate measures a specific skill: reliability when targets are difficult due to defender proximity, tight coverage, or late ball arrival. It does not capture:
- Receiver separation or route-running quality
- Target depth or difficulty beyond defender proximity
- Absolute receptions or fantasy value
- Whether the receiver is open on other plays

### Complementary Metrics

For complete receiving analysis:

$$\text{Total Receptions} = (\text{Clean Targets} \times \text{Clean Catch Rate}) + (\text{Contested Targets} \times \text{Contested Catch Rate})$$

- **Clean Catch Rate** (separation >1 yard) is typically >90% and highly stable. Represents floor performance.
- **Contested Catch Rate** is typically 40–55% for elite receivers, 25–35% for average. Represents ceiling performance and high-leverage upside.
- **Contested Target Rate** (contested targets / total targets) reveals role type: a receiver earning many contested targets is often specializing in 50/50 balls or red-zone work.

### Sample Size and Stabilization

Contested catch rate is volatile at small samples. A receiver catching 3 of 4 contested targets (75% CCR) is not a 75% talent—that's noise. The metric stabilizes at approximately **30 contested targets**, which typically takes a full season to accumulate for starting receivers.

- Below 15 contested targets: treat as descriptive, not predictive
- 15–29 contested targets: moderate signal, moderate noise
- 30+ contested targets: meaningful signal, usable for projection

### Platform Differences in Definition

**Critical divergence:** There is no universally standardized public definition of "contested" across providers. This makes cross-provider CCR comparison unreliable.

**PFF (Manual Charting):** 
- Defines contested as defender within one step and actively contesting
- Uses analyst review for every target; labor-intensive but context-aware
- Produces both CCR and contested target rate (contested targets / total targets)
- Considered the industry standard but subject to inter-rater variability
- Typical CCR figures are lower than NGS because PFF includes more marginal plays as contested

**NFL Next Gen Stats (Tracking Data):**
- Uses player tracking data to flag all targets where nearest defender ≤1 yard separation at ball arrival
- Objective and reproducible; no subjective judgment
- Misses nuance: a defender 1.1 yards away but fully extended may be more "contested" than one at 0.9 yards who is flat-footed
- Tends to under-count contested opportunities relative to PFF
- Typically produces 3–5% higher CCR than PFF because the 1-yard threshold is more inclusive

**Sports Info Solutions (Hybrid Charting):**
- Defines "competitive" catches as those where defender attempts to disrupt (broader than PFF)
- Falls between PFF and NGS in inclusion rate
- Most generous classification, produces highest CCR estimates

**Fantasy Aggregators (FantasyPros, PlayerProfiler, Rotowire):**
- Generally source from PFF or NGS without transparent attribution
- May display different CCR figures for the same player if sources diverge
- Many do not surface CCR at all, limiting utility for serious analysis

### Practical Consequence

A receiver reported as having 40% CCR from PFF is not the same as 40% CCR from NGS. The PFF figure represents higher-bar contested situations; the NGS figure includes more marginal plays. Do not compare cross-provider without knowing the source.

## Key Decisions

### For Fantasy Platform Design

**The platform will treat contested catch rate as a role descriptor and high-leverage performance indicator, not as a primary projection variable.** CCR helps identify "contested-catch specialist" roles (e.g., red-zone receivers, X receivers) but is too volatile and role-dependent to drive weekly projection independently.

**The platform will require minimum 30 contested targets before displaying CCR as a reliable metric.** Any CCR with fewer than 30 contested targets will be flagged as "limited sample" and de-emphasized in rankings and projections.

**The platform will source contested-catch data exclusively from PFF charting with transparent attribution.** Other providers' definitions are valid but create confusion if not disclosed. Defaulting to PFF avoids silent cross-provider comparison errors.

**The platform will pair CCR with contested target rate for role diagnosis.** A receiver with 50% CCR on 8% contested targets has a different profile (mostly open, occasional 50/50) than one with 50% CCR on 35% contested targets (specialist in difficult situations). Both need different projection approaches.

### For Receiver Evaluation

**Receivers with high contested catch rate and high separation rate are likely outperformers.** This combination suggests a receiver who both gets open (separation) and wins difficult targets (CCR). This is a premium skill profile.

**Receivers with high contested catch rate but low separation rate should be evaluated carefully for role sustainability.** High CCR in isolation may reflect:
- Specialization in difficult, low-volume opportunities (less sustainable)
- Selection bias (receiver sent into bad matchups only)
- Inverse relationship with overall catch rate (success on 50/50 balls may mask poor separation)

**Receivers with low overall catch rate but high contested catch rate are not negative regression candidates.** These receivers are performing legitimate high-difficulty work. Example: a red-zone specialist with 55% overall catch rate but 45% contested catch rate on many end-zone targets is performing as designed, not underperforming.

## Edge Cases and Pitfalls

### Small-Sample Volatility

Contested targets are rare events. A 4-for-9 contested performance in one week (44% CCR) can swing a season-long rate by 15–20 percentage points. Do not react to weekly CCR swings; aggregate over full seasons.

### Role Bias

Deep-ball receivers and jump-ball X receivers naturally show lower overall catch rates but higher contested target rates. Slot quick-game specialists post 75%+ clean catch rates and 0–5% contested target rates. These are not directly comparable without role adjustment.

### Selection Bias and Causation

A receiver who is targeted in contested situations is often there because he can't separate on other plays. High CCR can mask poor route-running by shifting focus to situations where separation failed. Do not assume high CCR indicates elite hands—it may indicate role specialization or necessity (covering for poor separation).

### Quarterback Accuracy Confound

A contested target from Josh Allen (high velocity, sometimes late) is systematically harder to catch than from a timing-based QB who leads the receiver. CCR conflates receiver skill with QB ball placement. When QB changes, expect CCR to shift even if receiver skill is stable.

### Sideline vs. Middle-of-Field

Contested catches on sideline fades are physically different from contested catches over the middle. Boundary awareness, footwork, and space constraints are distinct skills. A receiver who excels at sideline contested catches (e.g., Davante Adams on back-shoulder fades) may have lower overall CCR than a big-slot receiver who fights in the middle of the field, but higher **value** per contested catch (more touchdowns). CCR does not weight by situation.

### Threshold Ambiguity

The exact proximity threshold for "contested" affects classification. A defender at 0.9 yards vs 1.1 yards may be functionally equivalent; charting subjectivity across frames creates borderline plays that swing sample-size CCR.

## Open Questions

- **Year-over-year persistence of CCR:** How much of observed CCR variance is stable receiver skill after controlling for target depth, coverage, and quarterback? Current evidence suggests seasonal CCR has low persistence (r² ≈ 0.3–0.4 year-over-year), but this may reflect role changes rather than skill decline.
- **1-yard threshold modernization:** Is the 1-yard contested definition from NGS outdated for the 2025+ NFL? Rule changes favor receivers; a defender at 0.8 yards in 2025 is considerably less threatening than in 2015. Should the threshold shrink to 0.7 yards?
- **TE contested catch skill:** How much does contested catch rate for tight ends differ from wide receivers in meaningful ways? TEs face linebacker contact (physical, body-box engagement) vs. defensive back contact (coverage-based, timing-based). Current metrics don't distinguish these skill sets.
- **Pass interference as contested equivalent:** Should receivers who draw pass interference on contested attempts receive credit equivalent to a contested reception for fantasy purposes? DPI generates yardage but is invisible in CCR. The analytics community has no consensus.
