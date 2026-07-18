---
title: "Yards After Contact"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - yards-after-contact
  - yaco
  - contact-balance
  - elusiveness
  - efficiency
related:
  - player-evaluation/missed-tackles-forced
  - player-evaluation/yards-before-contact
  - player-evaluation/yards-after-catch
---

## Summary

Yards after contact (YAC in the rushing context, sometimes YACo to distinguish from receiving YAC) measures yardage gained from the point of first defensive contact until the end of the play, isolating a runner's ability to continue producing despite contact. YAC per attempt is more stable year-over-year (r ~0.40–0.50) than yards per carry, making it a valuable projection input independent of blocking quality. Contextualizing YAC with yards-before-contact reveals whether production is scheme-driven (yards before) or runner-driven (yards after), critical for assessing fantasy sustainability across team changes.

## Core Knowledge

### Definition and Calculation

Yards after contact (rushing context):

$$\text{YAC} = \text{Yards gained from first defensive contact until end of play}$$

Expressed as an efficiency metric:

$$\text{YAC per Attempt} = \frac{\text{Total yards after contact}}{\text{Carries}}$$

First defensive contact is defined as the point at which a defender makes meaningful contact with the ball carrier. This is distinct from:

- **Yards after catch (YAC):** For receivers, measured from the catch point (not first contact), can include yards in open space before any defender arrives
- **Yards before contact (YBC):** Yards gained from handoff until first defensive contact, reflecting blocking quality

Rushing YAC and receiving YAC are distinct metrics measuring different things. Do not conflate them.

### Decomposition of Rushing Production

Total rushing yards can be decomposed:

$$\text{Total rushing yards} = \text{Yards before contact} + \text{Yards after contact}$$

This decomposition reveals the sources of production:

- **High YBC, low YAC:** Blocking and scheme create space; runner converts it into ordinary gains. Production is environment-dependent. This profile is vulnerable to offensive line injuries or scheme changes.
- **Low YBC, high YAC:** Runner often contacted early but continues producing through contact. Production is more runner-skill-driven and resilient to blocking changes.
- **High YBC, high YAC:** Elite production profile combining scheme benefits with runner skill. Rare and highly valuable.
- **Low YBC, low YAC:** Limited production from both scheme and runner. Typically signals poor fit, role mismatch, or injury.

For fantasy projection, YAC/A is often more predictive of future fantasy production than raw yards per carry (YPC) because it better isolates repeatable individual skill from blocking environment.

### Year-over-Year Stability

YAC per attempt is **notably more stable** than yards per carry across seasons.

**Year-over-year correlations:**
- Yards per carry: r ~0.20–0.30 (low)
- YAC per attempt: r ~0.40–0.50 (moderate)
- Missed tackles forced per attempt: r ~0.45–0.55 (moderate-to-strong)

The higher stability of YAC/A suggests it captures a repeatable skill (contact balance, lower-body strength, leg drive) that persists across teammates and schemes. By contrast, YPC is heavily dependent on blocking quality, making it noisier year-to-year.

### Contact Location and Context

YAC interpretation depends on **where contact occurs:**

- **Second-level contact (4+ yards before first contact):** Runner reached space before contact. High YAC here reflects open-field skill. Production is less confounded by blocking.
- **Line-of-scrimmage contact:** Runner met at or near the line. YAC reflects power, balance, and ability to generate forward momentum through contact. Production is heavily scheme-dependent.
- **Backfield contact (negative yards before contact):** Runner tackled in the backfield. YAC becomes loss reduction. This scenario is influenced by protection breakdowns more than runner skill.

Providers do not consistently report contact location. When available (via PFF grading or tracking data), YAC interpretation improves substantially. Without location context, high YAC at the line of scrimmage is less impressive than high YAC in open space.

### Receiving YAC vs. Rushing YACo

A critical distinction that is often conflated:

**Receiving YAC (for receivers and pass-catching backs):**
- Measured from reception point, not first contact
- Can include yards in open space before any defender arrives
- Heavily influenced by catch location, design, and spacing
- A receiver catching a screen pass 5 yards downfield with 15 yards of space is credited with YAC, though limited contact-break skill was required

**Rushing YAC (for ball carriers):**
- Measured from handoff to first contact, then from contact to end
- Focused on production through/around contact
- Less scheme-dependent in the catch-to-contact phase (no design-created space)

The same player (a receiving back) can have different YAC profiles in receiving vs. rushing contexts. Yards after catch on screens is not equivalent to yards after contact on inside-zone runs.

### Small-Sample Volatility

Like other efficiency metrics, YAC/A requires adequate sample size:

- **Below 50 carries:** High variance. A few long runs or one strong short-yardage performance can skew the metric.
- **50–100 carries:** Preliminary signal. Confidence intervals are wide.
- **100+ carries:** Reliable signal. YAC/A is meaningful for player comparison.

Backups and situational players may never reach 100 carries. For these players, YAC/A is descriptive of what happened in their limited role, not predictive of what would happen with increased volume.

## Key Decisions

**The platform will use YAC per attempt as a primary efficiency metric, superior to yards per carry for projection.** YAC/A isolates individual skill better than YPC and is more stable year-to-year. When available, YAC/A is the platform's preferred efficiency input.

**The platform will always pair YAC with yards-before-contact when evaluating a runner.** The combination reveals whether production is scheme-driven or runner-skill-driven. A back with 3.5 YPC split as 0.8 YBC and 2.7 YAC/A is fundamentally different from one split as 2.4 YBC and 1.1 YAC/A, despite identical YPC.

**The platform will require contact-location data (when available) to evaluate YAC/A contextually.** High YAC/A achieved primarily in open space (second level) is more impressive and repeatable than high YAC/A achieved primarily at the line of scrimmage through power.

**The platform will distinguish rushing YAC from receiving YAC explicitly in any analysis.** These are separate skills. A player with strong YAC on screens may not translate that to rushing YAC, and vice versa.

**The platform will use YAC/A to identify potential buy-low or breakout candidates.** A running back with strong YAC/A despite low volume is a roster target if opportunity increases. A back with declining YAC/A paired with declining volume may be aging or injured; downgrade accordingly.

**The platform will normalize YAC/A expectations by role and scheme.** A gap-scheme back in short-yardage faces different contact scenarios than a zone-scheme back on designed runs. Cross-role comparisons should account for these differences.

## Open Questions

- **Optimal contact-location adjustment:** Should YAC/A be normalized differently for runners typically contacted at the line vs. second level? A unified regression model has not been published.
- **Scheme transferability:** How much of a gap-scheme back's YAC/A persists after a move to a zone-scheme team? Limited cross-scheme sample data exists.
- **Age-related decline:** Does contact-balance skill (YAC/A) age differently than explosive-run ability (breakaway rate)? Longitudinal studies are lacking.
- **Interaction with pass volume:** Do backs with high receiving volume maintain similar rushing YAC/A, or does receiving workload diminish rushing performance? The interaction is not well-studied.
- **Tracking-based measurement:** Will automated tracking eventually replace manual charting for contact-point definition and improve YAC/A precision? The optimal methodology remains debated.

---

_End of yards-after-contact.md_
