---
title: "Value-Based Drafting (VBD) — Baseline Selection and Decision Layers"
type: domain-knowledge
category: league-mechanics
status: active
last_updated: "2026-07-18"
confidence: high
tags:
  - vbd-drafting
  - value-based-drafting
  - positional-scarcity
  - tier-breaks
  - draft-strategy
  - auction-draft
  - adp
  - superflex
  - two-qb
  - best-ball
  - flex
related:
  - league-mechanics/league-size-scarcity-effects
  - league-mechanics/average-draft-position
  - league-mechanics/adp-ecr-differential
  - league-mechanics/superflex-two-qb-value-shift
  - league-mechanics/best-ball-strategy
  - in-season-management/reach-vs-value-detection-draft-day
  - league-mechanics/flex-spot-configuration
  - league-mechanics/zero-rb-hero-rb-robust-rb
  - league-mechanics/late-round-qb-strategy
  - league-mechanics/auction-draft-budget-allocation
---

## Summary

Value-Based Drafting converts position-specific projections into a single cross-positional currency by subtracting a replacement-level baseline from each player's projection — the subtraction itself is trivial arithmetic, and nearly all of VBD's real difficulty and nearly all of its documented failure modes trace back to how that baseline is defined, not to the formula. A baseline that is too shallow, too static, ignores flex pooling, or is imported from the wrong format (best ball into redraft, single-QB into superflex) produces confidently wrong rankings even when the arithmetic is correct. VBD is best treated as one layer in a larger decision stack — projection, baseline, risk adjustment, and market cost (ADP) — rather than a single number that resolves the draft-pick decision on its own.

## Core Knowledge

### The formula is simple; the baseline is the entire discipline

The core calculation is uniform across every source: a player's value is his projection minus the projected output of the replacement-level player at his position. This is functionally the same Value Over Replacement Player (VORP) mechanism already established as the driver of league-size scarcity effects — VBD is that mechanism applied specifically as a draft-day ranking tool. What varies, and what causes nearly every documented VBD error, is how "replacement level" gets defined. Multiple distinct, legitimate baseline construction approaches exist, and they answer different questions rather than approximating the same number with different precision:

- **Last-starter baseline.** The baseline is the projected output of the last player who would start weekly at that position under the league's exact roster rules (e.g., the 12th quarterback in a 12-team single-QB league). This is the simplest and most common approach, but it systematically inflates the value of elite players at any position with a large gap between the best starter and the last starter, and it ignores bench and waiver dynamics entirely.
- **Freely-available/waiver-replacement baseline.** The baseline is the best player realistically available on waivers after the draft, which sits deeper than the last-starter cutoff. This baseline generally compresses value at the top of the board and distributes more residual value into mid-to-late rounds, because it treats bench and streaming options as legitimate parts of the replacement pool.
- **Roster-construction/deeper-demand baseline.** A baseline that accounts for total rostered players at a position (starters plus typical bench allocation), rather than starters alone, sits deeper still. This approach is more realistic about how many players at a position are actually removed from the draftable pool by roster-building behavior, but is harder to calculate cleanly and requires assumptions about bench-hoarding patterns that vary by league culture.

No single baseline method is corroborated as universally correct — the right choice depends on the decision being made (a static pre-draft cheat sheet versus a live in-draft pick versus an auction valuation), and mixing baseline assumptions between a projection source and a valuation tool is one of the most common practical errors.

### Flex spots require pooling the baseline across eligible positions, not calculating it per position in isolation

This is one of the most heavily corroborated findings across sources. When a roster includes a flex slot (or superflex, or any multi-position-eligible slot), a player's true replacement is not necessarily the next player at his own position — it may be the best available player at any position eligible for that slot. Calculating running back and wide receiver baselines independently, without accounting for the fact that a flex spot pools demand across both positions, systematically misprices both: it can overstate running back value in shallow running back years and understate wide receiver value in deep wide receiver years, or the reverse, depending on which position the flex is actually being filled from in practice. The theoretically correct approach compares a flex-eligible player against the best remaining alternative across all positions that could fill that slot, not against a fixed positional cutoff — though implementing this cleanly is harder than single-position baselines and remains an area where tools vary significantly in sophistication.

### Static baselines decay; live drafts require dynamic recalculation

A baseline calculated before the draft begins is a snapshot, and its accuracy decays as the draft progresses. This is corroborated at high strength across sources: once players start coming off the board, the actual replacement level at a position shifts — a run on a position pushes its effective replacement baseline further down the list than the pre-draft calculation assumed, while a position nobody is drafting keeps its replacement level artificially strong. Treating a pre-draft VBD ranking as an unchanging queue to draft down mechanically is a documented failure pattern. The more defensible approach recalculates the relevant baseline (or at minimum, the marginal comparison against the next-best realistically available alternative) at each pick, particularly after any run of picks at a single position. This dynamic, in-draft comparison is a related but distinct concept from the static pre-draft baseline: it asks not "what is this player worth against a generic replacement" but "what is this player worth against what I can actually still get, including at my next turn."

### Superflex/2QB and best ball require format-specific re-derivation, not adjustment of a standard baseline

Two format shifts are corroborated strongly enough to treat as structural rather than incremental:

- **Superflex/2QB** roughly doubles league-wide starting quarterback demand against a fixed NFL supply of viable starters, which pushes the quarterback replacement baseline sharply deeper and produces a categorically different value curve than a single-QB league — consistent with the scarcity mechanism already established for superflex formats generally. A single-QB VBD baseline is not usable in superflex; it must be recalculated from the format's actual starting requirements, not scaled by a rule of thumb.
- **Best ball** requires a different value function entirely, because the format auto-selects the highest-scoring lineup each week rather than requiring a manager to start the right players. A player's best-ball value depends on his contribution to the optimal lineup across many simulated weeks — ceiling, spike-week frequency, and how much he overlaps with other rostered players — not his mean seasonal projection minus a standard-redraft baseline. Static, mean-based VBD rankings built for managed redraft should not be imported unadjusted into best ball, and the reverse is equally true.

### VBD and ADP measure different things and should be compared, not conflated

VBD estimates what a player is worth (production above replacement); ADP estimates what the market will make you pay for him (draft capital or auction dollars). These are corroborated as genuinely distinct axes, and the actionable signal is the comparison between them — a player with high VBD but a late ADP is a market inefficiency worth targeting; a player with modest VBD but an early ADP is a likely overpay — not either number in isolation. A ranking system that presents VBD-derived order as if it were a complete draft-pick recommendation, without weighing the actual cost of acquiring that value, is missing half the decision.

### Auction conversion is non-trivial

Converting VBD into auction dollar values is not a simple linear scaling of surplus value against total budget. Sources converge that a workable auction model needs at minimum a roster-fill cost component (money that must be spent to complete a roster regardless of surplus value) plus a variable pool distributed according to relative surplus, and that budget constraints, nomination order, and inflation among remaining players all distort a purely linear conversion in practice. Treating raw VBD score as directly proportional to auction price produces systematically wrong bids, particularly for players near replacement level (whose value can be at or near zero but who still command a minimum roster-fill price) and for the very top tier (where linear scaling tends to underpay stars relative to what competitive bidding actually requires).

### Mean-based VBD does not capture risk, and this is a genuinely unresolved integration problem

Standard VBD uses a single point-projection per player, which treats a stable, low-variance projection identically to a volatile, high-variance projection of the same mean. Sources agree this is a real limitation — a player with meaningful injury risk, role uncertainty, or boom/bust weekly variance is not fairly represented by a single expected-points number — but there is no corroborated, agreed-upon method for converting that uncertainty into an adjustment to the core VBD number. Approaches to risk-adjusting VBD exist conceptually (discounting the mean by some risk penalty, or evaluating ceiling and floor separately) but the correct penalty size, and even whether risk should be penalized at all rather than rewarded depending on roster context and league format, is contested rather than settled.

## Key Decisions

The platform will treat baseline selection as an explicit, configurable input rather than a fixed universal constant, offering last-starter, waiver-replacement, and roster-construction baseline options tied to the league's exact settings, because sources consistently agree these are legitimate methods answering different questions and no single method is correct for every decision context.

The platform will pool replacement-level calculations across all positions eligible for a shared flex (or superflex) slot rather than computing independent per-position baselines, because this is one of the most strongly corroborated sources of systematic VBD mispricing across sources, and the platform already models flex-driven scarcity effects elsewhere.

The platform will recalculate the effective replacement baseline (or at minimum surface the best currently-available alternative) dynamically during a live draft rather than presenting a single static pre-draft VBD ranking as the ongoing source of truth, because static rankings decaying into stale advice during positional runs is a heavily corroborated, high-confidence failure pattern.

The platform will maintain format-specific VBD models for single-QB, superflex/2QB, and best ball rather than a single model with format multipliers, because sources treat these as structural (not incremental) differences in the underlying value function — particularly the shift from mean-seasonal-projection value in redraft to lineup-capture value in best ball.

The platform will surface VBD and ADP together as a comparison (a "draft surplus" signal) rather than presenting VBD rank as a standalone pick recommendation, because sources agree these measure fundamentally different things — expected value versus market cost — and the actionable insight lives in their divergence, not in either number alone.

The platform will not build a linear VBD-to-auction-dollar conversion, and will instead model a roster-fill cost floor plus a variable surplus-value pool, because sources agree a purely linear conversion systematically misprices both near-replacement players and top-tier stars.

The platform will not adopt a specific numeric risk-penalty formula for adjusting mean-based VBD for player volatility, because sources explicitly flag this as unresolved and contested; risk/variance will instead be surfaced as a separate, visible input (ceiling, floor, injury probability) alongside the mean-based VBD number rather than folded into a single blended score.

## Open Questions

- [ ] Which baseline construction method (last-starter, waiver-replacement, or roster-construction) produces the most predictive draft guidance is not settled across sources — needs empirical backtesting against realized season outcomes or a platform-specific default decision.
- [ ] How exactly to pool flex-eligible baselines across positions (a simple max-of-baselines approach versus a more granular model of expected flex allocation by position) has no single corroborated method — sources agree pooling is necessary but disagree on implementation.
- [ ] What risk-adjustment method, if any, should be applied to mean-based VBD projections is explicitly unresolved across sources — needs a platform-specific decision on whether to surface risk separately or attempt a blended risk-adjusted score.
- [ ] Whether draft-day positional runs represent genuine information (the market correctly recognizing an approaching scarcity cliff) or exploitable overreaction (herd behavior the model should fade) is raised as unresolved across sources and likely varies by league sharpness.
- [ ] How to validate a VBD model's real-world accuracy (calibration against realized starter points, waiver-replacement performance, or draft-surplus-to-standings correlation) is raised as important but not resolved with a standard methodology across sources.
