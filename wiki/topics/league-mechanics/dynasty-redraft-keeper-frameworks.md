---
title: "Dynasty vs. Redraft vs. Keeper Value Frameworks"
type: domain-knowledge
category: league-mechanics
status: active
last_updated: "2026-07-18"
confidence: high
tags:
  - dynasty
  - redraft
  - keeper
  - age-curve
  - decline-modeling
  - trade-value
  - rookie-draft-capital
  - regression-baseline
  - contract-year
related:
  - league-mechanics/roster-construction-starting-lineups
  - league-mechanics/superflex-two-qb-value-shift
---

## Summary

Redraft, dynasty, and keeper formats value players over fundamentally different time horizons, and treating them as points on a single spectrum is a documented error — keeper is not "short dynasty," it is a distinct hybrid governed primarily by retention cost. Redraft value is current-season production minus replacement, with zero discounting of future seasons and age mattering only through its effect on this year's role and injury risk. Dynasty value is a multi-year discounted sum of expected surplus production, driven primarily by position-specific age curves (RB peaks earliest and declines sharpest, WR sustains longest among skill positions, QB/TE have the longest windows) plus a separate market-liquidity component. Keeper value is current-season production plus retained surplus relative to the draft-pick cost of keeping the player — a player can be a poor dynasty asset but an excellent keeper, or vice versa, because the two frameworks optimize for different things entirely.

## Core Knowledge

### The three frameworks value fundamentally different quantities

**Redraft** value is dominated by current-season projected production relative to replacement level, with no discounting of future seasons at all — a productive 30-year-old is worth more than an unproven 22-year-old if their current-year projections are comparable, because there is no future value to protect. Age matters only indirectly, through its correlation with current-year injury risk, role security, and snap-share trends — not as an independent valuation input.

**Dynasty** value is a discounted multi-year sum of expected production, where the discount factor reflects accumulating uncertainty about role, health, and career length. Because rosters persist indefinitely (or across a long multi-year horizon in practice, since teams re-draft rookies annually), a player's total value includes years the manager doesn't yet know will be productive. This creates a second value component beyond production: market/trade liquidity — the ability to convert the asset into something else before its value changes. Sources converge that dynasty value should be understood as production value plus a market-option value, and that this option value is influenced by non-rational factors like league-wide age preference and rookie-pick demand, not just expected points.

**Keeper** value is the most format-specific and least standardized of the three, because it depends entirely on the league's retention mechanism: how many players can be kept, at what cost (round penalty, escalating auction cost, or fixed schedule), and for how many years. The critical calculation is surplus value — the player's expected production value minus the cost of retaining him, expressed relative to what that retention cost (typically a draft-round slot) would otherwise buy. A player with modest dynasty value can be an excellent keeper if his retention cost is far below his market value; a clear dynasty asset can be a poor keeper if his retention cost has escalated to match his production.

### The most common and consequential error: conflating keeper with dynasty

Sources consistently flag this as the single most damaging mistake in keeper-format valuation: using dynasty rankings (which price long-term career horizon and age curves) to make keeper decisions (which are priced by retention cost and a short, fixed control window). A young player with high dynasty value may be a poor keeper if the format only allows one year of retention at an escalating cost, or if his keeper cost has already risen close to his actual market value. Keeper valuation should be built from redraft-style current production plus explicit retention-cost accounting, not borrowed from a dynasty ranking sheet.

### Age curves are position-specific, not uniform

Convergent findings across sources on relative career shape by position:

- **Running back** has the earliest peak (roughly age 22–26 depending on source) and the sharpest decline, typically beginning around age 27–28. This is attributed to the position's dependence on workload volume and physical contact, which compounds injury and wear risk faster than at other positions. This is the most consistently and strongly corroborated age-curve claim across all sources.
- **Wide receiver** peaks later and sustains longer than running back — commonly cited peak windows span the mid-20s through the late 20s, with a gradual rather than sharp decline extending into the early 30s for productive route-runners. Multiple sources note that WR decline is more tied to technical skill and target competition than pure athletic decline, making it harder to predict from age alone than RB decline.
- **Tight end** tends to develop later than other positions (rookie and second-year tight ends are frequently unproductive) but sustains a long plateau once established, often into the early-to-mid 30s.
- **Quarterback** has the longest usable window of any position, commonly into the mid-to-late 30s for pocket passers, with rushing quarterbacks carrying a modestly different risk profile due to added injury exposure.

Sources caution against applying age curves as a fixed percentage decay uniformly to all players at a position — the correct application is conditional on role security, prior workload, and team context, not age alone. A highly-targeted 28-year-old receiver with a secure role can be a safer dynasty asset than a 23-year-old receiver on an unresolved depth chart.

### Rookie draft capital functions differently across all three formats

In **redraft**, rookie draft capital (where a player was selected in the actual NFL draft) is a weak signal; current-year role and opportunity dominate, and a highly-drafted rookie without a clear role can be worth less than an established veteran.

In **dynasty**, rookie capital is a genuine value input early in a player's career — it reflects team investment and expected opportunity — but its weight should decay as actual NFL production accumulates. Sources agree the correct pattern is for observed usage to progressively replace draft-capital priors, not for draft capital to remain a permanent value anchor.

In **keeper**, rookie capital's relevance is filtered entirely through retention cost and timing: a highly-drafted rookie who isn't expected to contribute this season can still be an excellent keeper if his retention cost is negligible and the format allows multi-year control, while the same player is a weak keeper if cost escalates faster than his production develops.

### Contract-year effects are a weak, overused signal

Multiple sources independently push back on the common heuristic that players "play for a contract" and reliably outperform in a contract year. The evidence for a direct, causal performance bump is weak and inconsistent across sources — one source explicitly notes wide receivers in contract years do not reliably outperform baseline, while running backs may see a slight, secondary bump because teams continue feeding them before a transition. The more reliable use of contract information is as a signal of role stability or likely team change, not as a standalone performance predictor.

### Market-based and projection-based valuation tools diverge systematically

Sources converge that dynasty valuation tools split into two categories with different failure modes: market/crowd-sourced platforms (reflecting aggregated trade sentiment) tend to overreact to recent news, hype rookies aggressively, and underprice aging-but-still-elite veterans; projection-based or expert-consensus tools tend to react more slowly to role changes and can lag real depth-chart shifts. Neither approach is inherently superior — they fail in different, predictable directions, and treating either as ground truth without cross-checking is a documented pitfall.

## Key Decisions

The platform will calculate redraft value as current-season projected production minus replacement level, with no future-season discounting and age treated only as an input to current-year injury/role risk, because all sources agree redraft has no future value component to protect.

The platform will calculate dynasty value as a discounted multi-year sum of expected surplus production using position-specific (not uniform) age curves — earliest and steepest decline for RB, later and more gradual decline for WR, and the longest windows for QB and TE — because this ordering was independently corroborated across all six sources as the dominant driver of dynasty value.

The platform will calculate keeper value as current-season production plus retained surplus value (expected future production minus retention cost, expressed relative to the draft-pick slot the retention cost represents), and will not derive keeper valuations from dynasty rankings, because sources consistently identify conflating the two as the most damaging and avoidable keeper-format error.

The platform will weight rookie draft capital as a meaningful but decaying input in dynasty valuation, being progressively superseded by observed NFL usage as a player accumulates a track record, and will treat rookie capital as a weak signal in redraft valuation, because this differentiated treatment was corroborated across sources.

The platform will not treat "contract year" status as a standalone positive performance signal in any format, using it instead only as a role-stability or team-change indicator, because the causal performance-boost claim was specifically challenged as weak evidence by multiple independent sources.

The platform will not adopt a single fixed numeric discount rate for dynasty future-season valuation (proposed rates varied from roughly 5% to 20%+ annually across sources with no consensus methodology) or fixed age-decline percentages by position as settled figures, because these varied too widely across independent sources to be treated as verified constants. An alternative of averaging the proposed discount rates was considered and rejected, since averaging incompatible, unverified figures manufactures false precision; the platform will instead expose discount rate and age-curve steepness as configurable parameters informed by the qualitative ordering above.

## Open Questions

- [ ] The exact numeric discount rate for multi-year dynasty valuation is unresolved — proposed figures ranged from roughly 5% to 20%+ annually with no shared methodology across sources; needs either empirical backtesting against realized dynasty trade outcomes or a deliberate platform default with documented rationale.
- [ ] Whether dynasty valuation should optimize for expected production or expected market/trade value is raised as a genuinely unresolved tension across sources — these are correlated but not identical, and a platform-specific decision on which to prioritize (or how to blend them) is needed.
- [ ] The correct convexity of rookie draft-pick valuation (e.g., whether an early first-round rookie pick is worth a fixed multiple of a late first-round pick, or scales non-linearly) is inconsistently addressed across sources and needs further verification against realized dynasty rookie-pick trade data.
- [ ] Whether keeper-format inflation models (how retained players reduce the effective draft pool and inflate remaining auction/draft costs) are being correctly priced by managers in practice, versus systematically mispriced, is raised as an open question without a settled resolution across sources.
