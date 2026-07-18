---
title: "Value Over Replacement Player (VORP / Value-Based Drafting)"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - vorp
  - vbd
  - value-based-drafting
  - draft-strategy
  - positional-scarcity
  - trade-value
related:
  - player-evaluation/expected-fantasy-points
  - player-evaluation/fantasy-points-over-expected
  - league-mechanics/draft-strategy
---

## Summary

Value Over Replacement Player (VORP), also called Value-Based Drafting (VBD) in draft contexts, measures a player's fantasy production above the production of a replacement-level player at the same position: VORP = Player Points − Replacement Points. VORP is not an absolute metric; it is league-dependent and changes with roster structure, scoring format, and league size. VORP is the foundation of cross-positional draft valuation because it accounts for positional scarcity—why a running back with lower raw points than a wide receiver can be more valuable (the RB replaces a weaker waiver alternative). VORP is primarily a draft-day and trade-evaluation tool, not a weekly lineup decision tool.

---

## Core Knowledge

### What VORP Measures

VORP is the fantasy-point surplus a player generates above the production of a "replacement player" at their position. The formal definition:

$$\text{VORP} = \text{Player Fantasy Points} - \text{Replacement-Level Fantasy Points}$$

The replacement player is defined as the best player available as a free agent or waiver pickup after the draft—the point where the position's supply of meaningful starters is exhausted.

**Example**: In a 12-team, 2-RB/3-WR league, the replacement-level running back is approximately RB#24 (the 12th-best RB, representing the last startable RB after 2 per team are drafted). The replacement wide receiver is approximately WR#36 (the 12th-best WR). If the top RB scores 300 points and RB#24 scores 150, the top RB's VORP is 150. If the top WR scores 280 points and WR#36 scores 180, the top WR's VORP is 100. Despite the WR's raw higher points, the RB has higher VORP—meaning the RB is the more valuable acquisition because replacing him is harder.

### Why Replacement Level Depends on League Context

There is no universal replacement level. It varies by:

- **Number of teams**: In 10-team leagues, replacement RB is RB#20. In 12-team leagues, RB#24. In 14-team leagues, RB#28.
- **Starting lineup requirements**: A league starting 3 WRs has a lower WR replacement level (WR#36) than one starting 2 WRs (WR#24).
- **Flex spots**: Flex positions allow cross-position replacement, making positional baselines fluid. Flex also reduces the distinction between positions.
- **Superflex**: Superflexed QB eligibility drops QB replacement level from QB#12–14 to QB#24–36, massively raising QB VORP.
- **Bench depth and waiver liquidity**: A league with 10-deep benches has different effective replacement level than one with 5-deep benches.
- **Scoring format**: Full-PPR changes reception-dependent positions (WR, TE) relative to PPM formats. TE-premium scoring raises TE replacement level and VORP.
- **Scoring system for specific positions**: Six-point passing TDs raise QB VORP; two-point receptions raise TE VORP.

A VORP value is only meaningful when the replacement baseline is known and matches the league's actual constraints.

### Positional Scarcity and VORP Ranking

The power of VORP is that it transforms raw fantasy points into a league-specific decision framework. Here's why:

Suppose QB league points = 280, TE league points = 200, RB league points = 250, WR league points = 270. Raw ranking suggests: QB > WR > RB > TE.

But:
- QB replacement ≈ 240 (league-average quality is high; replacement QBs score well)
- WR replacement ≈ 180 (WR depth is weak; replacement WRs are low-value)
- RB replacement ≈ 120 (RB scarcity is extreme; replacement RBs are very low-value)
- TE replacement ≈ 100 (TE replacement is extremely low; only a few TEs are startable)

VORP ranking becomes: RB (130 points above replacement) > QB (40) > WR (90) > TE (100). The RB, despite lower raw points, is most valuable because you can't easily replace him. The QB, despite high raw points, has low VORP because a replacement QB is readily available.

This is the core insight: **VORP accounts for positional scarcity, which raw points do not.**

### VORP for Different Decision Contexts

**Draft valuation (preseason VORP)**: Replace 'Points' with season-long or rest-of-season projections. Rank players by VORP to determine draft order (after adjusting for ADP and positional distribution).

**Trade valuation (in-season VORP)**: Replace 'Points' with rest-of-season projection, updated for current role. Recompute replacement level based on current waiver/free-agent availability. A player with 150 VORP before injuries may have 80 VORP after three starters at his position get hurt (replacement level dropped).

**Weekly lineup decisions**: VORP is less useful for start/sit, because it's season-long aggregate. Use matchup-adjusted expected points for weekly decisions.

**Dynasty**: Use multi-year projected VORP with age-curve decay, not single-season points.

### Replacement Level Calculation Methods

**Method 1 — Fixed positional rank**: In a 12-team league starting 2 RBs, replacement is RB#24. Simple, transparent, consistent.

**Method 2 — Roster-construction average**: Average the projected points of the 3–5 players near the positional threshold to smooth outliers.

**Method 3 — Waiver-tier estimate**: Use historical waiver-wire performance data to estimate what the next available player would produce. More realistic but requires league-specific data.

**Method 4 — Flex optimization**: For leagues with flex, solve the optimization problem: "What is the minimum-value player who would start in the optimal lineup?" Answer varies by overall player pool quality.

Most public tools use Method 1 (fixed rank). Method 4 is theoretically ideal but requires computational modeling.

---

## Key Decisions

- **Decision:** The platform will calculate league-specific VORP, not provide generic values.
  **Reasoning:** VORP values are meaningless without matching league parameters. A 12-team league value is garbage in a 10-team league. Providing generic VORP would be actively harmful.
  **Rejected alternative:** Pre-computed VORP leaderboards for a "default" league was rejected as misleading; users would misapply them to non-matching formats.

- **Decision:** The platform will default to the "fixed positional rank" method (RB#24, WR#36, TE#12 in 12-team, 2-RB, 3-WR leagues) and allow users to adjust league parameters.
  **Reasoning:** Fixed rank is transparent and allows easy mental recalculation. It also matches ADP-based draft preparation; users already think in terms of positional ranks.
  **Rejected alternative:** Automated waiver-tier or optimization-based replacements were rejected as opaque and requiring user trust in a black-box calculation.

- **Decision:** The platform will recalculate VORP weekly during the season based on current waiver-availability data and updated projections, not use preseason baselines year-round.
  **Reasoning:** In-season replacement level shifts as injuries, breakouts, and busts alter the available player pool. Stale VORP produces bad trade decisions.
  **Rejected alternative:** Using fixed preseason VORP year-round was rejected as analytically wrong post-draft.

- **Decision:** The platform will not combine VORP across positions into a single "overall value" leaderboard without explicit scarcity weighting.
  **Reasoning:** Raw VORP already accounts for scarcity, but mixing positions (showing RBs and WRs on the same ranked list without caveats) is confusing; the appearance of a uniform list falsely suggests direct comparability.
  **Rejected alternative:** Cross-position ranking by VORP alone (RB#1 vs. WR#1 as if they're peers) was rejected as creating confusion about positional differences.

---

## Best Practices

### High Confidence

- **Use VORP for draft strategy.** Compare players' VORP within your league's exact format. Adjust ADP based on VORP divergence (if a consensus WR is valued at ADP #20 but has VORP equivalent to ADP #35, they're a value target).

- **Use VORP for trade analysis.** When evaluating a potential trade, compute both players' rest-of-season VORP under current roster constraints. High VORP mismatch doesn't automatically reject a trade (role fit, positional need, playoff schedule matter too), but it's your starting frame.

- **Define replacement level explicitly for your league.** Don't use generic VORP from another league. Know your own league's starting requirements, bench depth, waiver-wire quality, and scoring rules. Tailor replacement baseline accordingly.

- **Recompute replacement level seasonally and after major roster shifts.** If three RBs get injured, RB replacement level drops and all remaining RBs' VORP rises. Use this as a signal to re-evaluate roster value.

- **In auctions, convert VORP to dollar values.** Auction pricing should be proportional to VORP, not raw points. If total positive VORP is 2000 points and you have $200 to spend, each VORP point ≈ $0.10. Adjust for positional demand and scarcity via market mechanics, not through false arithmetic.

### Moderate Confidence

- **Use VORP with positional context.** Don't say "Player A (120 VORP) is better than Player B (100 VORP)" without noting their positions. If A is a TE and B is an RB, the statement is misleading even if raw VORP numbers favor A.

- **Adjust VORP for injury risk and durability.** Two players with identical VORP projections can have different trade value if one is injury-prone. VORP is not sufficient for valuation; risk adjustment is separate.

- **Use VORP in the early/mid draft, recalibrate in late rounds.** Early draft VORP differences are sharp and predictive. By round 10+, VORP of remaining players may be nearly identical or even zero (replacement approaches. Switch to ceiling/floor and positional scarcity hunches late.

### Lower Confidence

- **The exact shrinkage parameter for in-season VORP updates.** When injuries alter replacement level, how much should old VORP be revised versus updated projections incorporated?

- **Whether bench-depth should adjust replacement level.** A league with 12-deep benches has different effective replacement than one with 4-deep. Should replacement level be the "worst starter" or "best waiver player"? No universal answer.

- **Cross-league VORP comparison.** Comparing a player's VORP in a 12-team league to his VORP in a 14-team league requires careful recalibration of replacement baseline; raw numbers are not comparable.

---

## Edge Cases and Pitfalls

**Superflex and QB VORP inflation**: In 1-QB leagues, QB replacement is strong (QB#12 or even QB#20 is startable). In Superflex, QB replacement drops to QB#30+, massively raising top-QB VORP. Don't apply 1-QB VORP values to Superflex drafts.

**Flex-position ambiguity**: In a 1-Flex league (RB/WR/TE flex), replacement level for flex-eligible positions is not independent. A TE's VORP depends on whether a WR or RB is in flex. Calculating positional VORP independently and summing them is wrong; use unified flex pool or explicit flex adjustment.

**Zero-VORP trap**: A player at exactly replacement level has zero VORP. This doesn't mean no trade value; it means you're trading replacement for replacement. Trade value is about need fit, roster construction, and upside—not VORP alone.

**Season-long vs. weekly VORP**: A player projected for 200 points with high injury risk has different value than a 200-point player who's durable. VORP of 100 (season) is not the same as VORP of 6.25 (per week) in utility terms. Use weekly VORP for in-season decisions; season VORP for draft/dynasty.

**Replacement regression**: After injuries or breakouts, replacement level changes, but users often forget to recalibrate. A backup RB who becomes a starter may have soared in VORP, but naive season-opening projections don't capture the updated baseline.

---

## Open Questions

- What is the optimal definition of replacement level in the modern NFL given play-volume inflation and positional eligibility rules?
- Should replacement level be dynamic within a season (adjusted weekly as waiver pool changes) or fixed from draft day?
- How should multi-eligible players (WR/RB designations) be handled in replacement-level calculations?
- What is the true relationship between VORP and playoff-winning probability? Does high VORP always correlate to championship upside, or can roster construction and matchup luck matter more?

---

_End of value-over-replacement.md_
