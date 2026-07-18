---
title: "Passing TD Value: 4pt vs. 6pt"
type: domain-knowledge
category: league-mechanics
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - passing-td-value
  - vbd-drafting
  - value-based-drafting
  - stacking
  - superflex
  - two-qb
related:
  - league-mechanics/superflex-two-qb-value-shift
  - league-mechanics/ppr-half-ppr-standard-scoring
  - league-mechanics/roster-construction-starting-lineups
---

## Summary

Shifting passing-touchdown scoring from 4 to 6 points adds exactly 2 points per passing touchdown to a quarterback's score — a mechanical, uncontroversial change. The strategically important question is not the raw point increase but the replacement-adjusted value shift: whether the format widens the gap between elite quarterbacks and the replacement-level quarterback more than it inflates the entire position uniformly. Corroborated strongly across sources, the shift favors high-volume, efficient pocket passers relative to rushing-dependent quarterbacks, but rushing production remains disproportionately valuable on a per-unit basis and the shift rarely reverses established rushing-QB advantages outright — it narrows the gap rather than closing it.

## Core Knowledge

**The direct scoring effect is 2 points per projected passing touchdown, applied uniformly across the position.** This means every quarterback gains points under a 6-point format, including replacement-level and waiver-level options. The relevant value calculation is not the raw point gain but value over replacement: `ΔValue = 2 × (Player's projected TDs − Replacement QB's projected TDs)`. If replacement-level quarterbacks also throw a meaningful number of touchdowns, the positional separation created by the format change is smaller than the raw scoring bump suggests.

**Rushing production remains disproportionately valuable regardless of passing TD setting.** Rushing yards are commonly scored at 2–2.5x the per-yard rate of passing yards in standard formats, and rushing touchdowns are typically worth the same 6 points in both 4pt and 6pt passing-TD leagues. A mobile quarterback's rushing floor is largely insulated from the passing-TD scoring change. Sources converge that a 6-point shift narrows the value gap between elite pocket passers and rushing quarterbacks but does not reliably reverse it — an elite rushing quarterback with a secondary passing floor typically remains a premium asset even in 6-point formats.

**The shift's magnitude depends heavily on league structure, especially single-QB vs. Superflex/2QB.** In single-QB leagues, the 6-point shift produces a modest, real increase in top-quarterback draft value — sources converge this generally translates to roughly one round of draft-value movement for the elite tier, not a wholesale repositioning of the position. In Superflex and 2QB leagues, the effect compounds with the pre-existing scarcity dynamics documented in Superflex/2QB value-shift analysis (see related page): because replacement-level quarterback is already scarce and low-scoring in these formats, the same 2-point-per-TD bump produces a proportionally larger separation between startable and replacement quarterbacks.

**Interception penalty settings materially interact with the passing-TD value and must be evaluated together.** A 6-point passing-TD league paired with a shallow interception penalty (e.g., -1 or -2) insulates high-volume, turnover-prone passers, while a steep penalty (-3 or -4) rewards efficient, low-turnover quarterbacks more heavily. Passing-TD value cannot be assessed as an isolated scoring setting — it must be read alongside the league's full scoring system.

**QB-stacking (rostering a QB with a pass-catcher on the same team) becomes more valuable in 6-point formats, but the effect is narrower than commonly assumed.** The 6-point shift raises the QB's share of a shared touchdown event — when the QB throws a TD to his stacked receiver, the pair earns 12 combined TD points (6+6) versus 10 (4+6) in a 4-point league. This is a 2-point increase in the *quarterback's* portion of the outcome; it does not change the receiver's touchdown probability, target share, or independent scoring. The strategic value of a stack is concentrated in cases where the quarterback's touchdown distribution is genuinely concentrated on one or two pass-catchers — a quarterback who spreads touchdowns broadly across a receiving corps produces a materially weaker stack-specific bump even though his standalone value rises normally.

**Stacking is a correlation and ceiling tool, not a projection multiplier.** Sources converge that stacking increases the covariance of a lineup's outcomes — when the offense hits, both roster spots hit together, and when it fails, both can fail together. This raises weekly ceiling and is more valuable in best-ball, tournament, and playoff-week-weighted formats than in season-long head-to-head leagues that reward median weekly outcomes. The reason to stack is the correlation itself, not an increase in either player's individual expected points.

**Touchdown-rate projections are inherently volatile year over year**, driven by red-zone efficiency, interception avoidance, team offensive quality, and target concentration, all of which are less stable than passing yardage or attempt volume. Building a 6-point-format valuation heavily around a single prior season's touchdown rate, without regression, is a widely corroborated failure pattern — the penalty for over-projecting touchdowns is 50% larger in 6-point than 4-point formats given the doubled per-TD weight.

## Key Decisions

The platform will calculate quarterback value under 6-point passing-TD scoring as value-over-replacement (using the league's actual replacement-level quarterback baseline), not as a raw point increase applied uniformly to rankings, because the corroborated evidence is that the strategic effect depends entirely on how much more the elite tier gains relative to replacement, not on the absolute point inflation across the position.

The platform will maintain rushing production as a distinct, weighted input to quarterback valuation independent of passing-TD setting, because rushing yards and touchdowns are scored favorably regardless of the passing-TD value and sources converge that rushing quarterbacks retain a meaningful, often decisive, valuation edge even in 6-point formats.

The platform will evaluate passing-TD value jointly with interception penalty settings rather than as an isolated scoring parameter, because the two settings interact directly to determine whether the format rewards volume or efficiency at quarterback.

The platform will model QB-stacking value as a function of the quarterback's touchdown concentration on a specific pass-catcher (not his total touchdown volume), because the corroborated mechanism is that the 6-point shift raises the quarterback's share of a jointly-scored event — concentrated touchdown distributions produce a materially larger stack-specific benefit than diffuse ones.

The platform will not adopt specific numeric draft-round adjustments (e.g., "move QBs up exactly 1.5 rounds") or precise stack-value percentage boosts offered by individual models as settled figures, because these varied substantially across independent sources with no consistent underlying methodology. Directional and structural guidance — the shift is real, replacement-adjusted, and compounds with Superflex/2QB scarcity — is adopted instead of fixed numeric coefficients. An alternative of averaging the various numeric claims across models was considered and rejected, since averaging inconsistent, unverified figures manufactures false precision.

## Open Questions

The precise draft-round or ADP adjustment attributable specifically to a 4-to-6-point passing-TD shift is not established with a single verifiable, corroborated figure; models offered inconsistent specific round or percentage estimates, so only directional guidance is adopted.

Whether 6-point passing-TD scoring meaningfully reduces the standalone advantage of elite rushing quarterbacks, or whether that advantage is structurally resilient regardless of passing-TD setting, is raised as a genuinely contested question across sources without a settled resolution — the answer appears to depend on the specific rushing/passing production mix of the individual quarterback being evaluated.

How touchdown-scoring correlation between a quarterback and a specific stacked receiver should be modeled probabilistically (versus simplified as a fixed touchdown-share percentage) is raised as an open modeling problem; sources agree the mechanism exists but disagree on how precisely it can be forecast from public data.

Whether TE-QB stacks should be valued differently than WR-QB stacks given tight ends' generally lower touchdown volume and different covariance structure is raised as an unresolved question with no rigorous published analysis identified across sources.
