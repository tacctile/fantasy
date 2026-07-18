---
title: "Missed Tackles Forced"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - missed-tackles-forced
  - mtf
  - contact-avoidance
  - elusiveness
  - yards-after-contact
related:
  - player-evaluation/yards-after-contact
  - player-evaluation/yards-before-contact
---

## Summary

Missed tackles forced (MTF) measures how frequently a ball carrier causes a defender to fail a tackle attempt, isolating elusiveness and contact-avoidance skill independent of blocking. MTF is highly provider-dependent (PFF manual charting vs. NGS tracking can differ by 10–20 forced misses per season for the same player), requiring consistent source comparison. Year-over-year stability is strong relative to other efficiency metrics (r ~0.45–0.55), making it useful for identifying players who create yards independently of blocking quality, though must be paired with yards-after-contact and yards-before-contact for complete context.

## Core Knowledge

### Definition and Calculation

Missed tackles forced measures the count of defensive tackle attempts that the ball carrier evades or breaks.

$$\text{Missed Tackle Rate} = \frac{\text{Missed tackles forced}}{\text{Carries (or receptions)}}$$

A broader version includes all touches:

$$\text{MTF per Touch} = \frac{\text{Missed tackles forced}}{\text{Carries + receptions}}$$

A "missed tackle" is defined as a defender who attempted a tackle but failed to bring down or stop the ball carrier. Definitions vary by charting methodology:

- **PFF standard:** Defender had a realistic opportunity to make the tackle but failed (whiff, broken tackle, outran)
- **Tracking-based:** Automated detection of tackle attempts and failures via position and velocity analysis

The subjective element is the threshold: did the defender have a reasonable opportunity? A defender who is already blocked or falling is sometimes credited differently than one who had a clear angle but missed.

### Receiver vs. Running Back MTF

For **receivers**, MTF typically refers to missed tackles after the reception:

$$\text{MTF per Reception} = \frac{\text{Missed tackles forced after catch}}{\text{Receptions}}$$

For **running backs**, MTF includes:
- Arm tackles evaded before contact becomes full
- Wrap-up attempts broken
- Stiff-arm scenarios (debatable charting)
- Defenders who slip or lose balance while attempting

For **tight ends and pass-catching backs**, the line between receiving MTF and rushing MTF can blur, particularly on jet sweeps, screen passes, and designed touches.

### MTF as a Skill Indicator

MTF attempts to isolate individual talent: the ball carrier's ability to avoid or break contact. High MTF suggests:

- Superior balance and leg drive
- Ability to maintain momentum through contact
- Vision to set up defenders or use blockers as screens
- Slipperiness or lateral agility
- Lower-body strength and pad level

However, MTF is heavily influenced by context. A running back who routinely faces defenders in space (often reaching the second level, indicating good blocking) will naturally have more opportunities to force misses. A back tackled at or behind the line of scrimmage has no opportunity to break or avoid contact.

### Year-over-Year Stability

MTF per attempt has **moderate-to-strong year-over-year stability** (r ~0.45–0.55), making it one of the more repeatable efficiency metrics. This is notably higher than yards per carry (r ~0.20–0.30), suggesting MTF captures something more stable: the runner's individual contact skill.

However, stability is conditional on:

- Role consistency (same team, gap vs. zone scheme)
- Volume consistency (total carries or receptions)
- Injury status (speed, burst, and balance can degrade)
- Defensive scheme exposure (gap-scheme backs face different contact patterns than zone backs)

A backup who becomes a starter may or may not maintain their per-touch MTF rate, depending on whether role changes (increased carries in short-yardage, goal-line, congested areas) suppress the metric.

### Provider and Charting Differences

MTF is highly dependent on the charting source.

**PFF (manual film review):**
- Explicit criteria for tackle opportunities
- Consistency across seasons through established reviewer training
- Subjective judgment on borderline calls
- Publicly available but proprietary weighting of tackle difficulty

**NFL Next Gen Stats (tracking-based):**
- Uses player-tracking coordinates and velocity to infer tackle attempts
- Automated and objective on contact events, but may miss subjective "missed opportunity" scenarios
- Can diverge significantly from PFF on the same player (documented differences of 15–20 forced misses per season)

**Other sources:**
- Some platforms republish PFF or NGS data
- Some use independent charting with less published methodology
- Cross-provider comparison is unreliable without explicit source documentation

**Documented discrepancies include:**

- Whether a stiff arm is credited as a forced miss or a blocking action
- Whether a defender being blocked counts as an attempt with a "missed" result
- Whether contact initiated by the runner (charging into a defender) counts as a forced miss
- Whether slips and falls count as forced misses or defensive failures
- Whether gang tackles credit multiple misses or a single failure

### Selection Bias and Context Confounds

MTF is influenced by factors beyond runner skill:

- **Blocking environment:** A runner behind an elite offensive line that creates consistent second-level conflicts will face more opportunity to force misses in space. A runner behind a poor line faces early contact and limited opportunity.
- **Scheme:** Outside-zone schemes create more space and perimeter miss opportunities. Goal-line/short-yardage packages create congested contact and fewer miss opportunities.
- **Game situation:** Leads encourage light boxes and deeper defensive leverage, creating space for miss opportunities. Deficits invite stacked boxes and earlier contact.
- **Defensive quality:** Some defenses are more disciplined and form-tackle oriented; others rely on solo-attempt tackling (more misses).
- **Player role:** A receiving back who catches short passes in space will have different miss opportunities than a between-the-tackles power back.

High MTF is not purely evidence of elite talent; it is evidence of elite talent **in the player's current role and environment**. Transferability to different situations (new team, new scheme, workload change) is uncertain.

## Key Decisions

**The platform will use MTF per attempt primarily to identify players creating yards independently of blocking.** High MTF (>0.20 per carry) combined with high yards-after-contact signals individual skill and production resilience even if blocking declines.

**The platform will always pair MTF with yards-before-contact and yards-after-contact.** MTF alone cannot distinguish between a runner whose productivity is scheme-driven vs. skill-driven. The three metrics together answer: "How much of this player's production comes from individual contact avoidance?"

**The platform will require minimum sample size (50–75 carries for preliminary signal; 150+ for reliable year-over-year comparison) before using MTF for evaluation.**

**The platform will compare MTF strictly within provider.** PFF MTF and NGS tracking-derived MTF are not interchangeable. Cross-provider MTF comparisons are invalid without explicit conversion or normalization.

**The platform will downgrade MTF-based confidence when role changes dramatically.** If a backup becomes a starter (workload increases, touches shift to short-yardage or goal-line), prior-season MTF may not transfer. Re-anchor to current-season data and expect potential regression toward new-role baseline.

**The platform will use MTF to identify waiver-wire upside when workload increases.** A high-MTF back whose team's lead back is injured is a strong buy signal: if opportunity increases, the player is likely to create yards independent of blocking, producing immediate value.

## Open Questions

- **Attribution between runner and defender:** How much of an MTF is the runner's elusiveness vs. the defender's poor angle or technique? Film can help, but quantifying this split remains difficult.
- **Stability across gap vs. zone schemes:** Does a back's MTF rate transfer if moved from a gap-scheme team to a zone-scheme offense (or vice versa)? Limited cross-scheme sample data exists.
- **Age-related decline:** At what age does MTF degrade? Do elite contact-balance runners maintain MTF into their early 30s, or does it decline sharply after age 27–28? Longitudinal study is lacking.
- **MTF vs. YAC primacy:** Is a high-MTF back with moderate YAC more valuable than a high-YAC back with low MTF? Depends on role and scheme, but comparative prediction models are underdeveloped.
- **Charting improvements:** Will tracking-based MTF (NGS) eventually replace manual charting, or do tracking systems miss subjective opportunity-evaluation aspects that human charting captures?

---

_End of missed-tackles-forced.md_
