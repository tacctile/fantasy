---
title: "Roster Construction / Starting Lineup Requirements"
type: domain-knowledge
category: league-mechanics
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - roster-construction
  - positional-scarcity
  - vbd-drafting
  - value-based-drafting
  - bye-week
  - handcuff
  - waiver-wire
related:
  - league-mechanics/flex-spot-configuration
  - league-mechanics/superflex-two-qb-value-shift
  - league-mechanics/ppr-half-ppr-standard-scoring
---

## Summary

A league's starting lineup requirements (positions and counts), total roster size, and IR slot allocation jointly determine positional demand, waiver-wire liquidity, and optimal draft strategy — independent of scoring format. Required starters set a hard weekly positional demand floor (`starters × teams`), while bench size and IR capacity determine how much additional depth is removed from the shared player pool and how forgiving the format is toward injuries, bye weeks, and speculative stashing. The most heavily corroborated principle is that generic, format-agnostic rankings and replacement-level baselines are unreliable — value must be recalculated against the league's exact starter count, flex allocation, and bench depth.

## Core Knowledge

**Positional demand is set directly by required starters, but effective demand is higher once flex allocation is included.** The baseline demand at a position equals `required starters × number of teams`. Flex-eligible positions add further demand proportional to how often that position actually wins the flex spot in practice (empirically RB and WR dominate standard flex; TE rarely competes without a scoring premium — see the flex spot configuration page). A league's true positional demand is understated if only the fixed lineup slots are counted and flex allocation is ignored.

**Bench size and IR slot count control waiver-wire liquidity, and this cuts in two directions.** A shallow bench (5–6 spots) keeps more talent on the open waiver wire, rewarding active streaming at low-VORP positions (QB, TE, D/ST in single-starter formats) and reducing the value of speculative bench stashes, since replacement options remain available in-season. A deep bench (8+ spots) removes more players from circulation, which increases the value of contingent handcuffs, rookie stashes, and injury insurance, but also makes waiver-wire breakouts scarcer and raises the cost of drafting for pure upside rather than immediate production.

**IR slots function as depth extenders, not free additional bench spots — and only for players who are genuinely injured with a plausible return timeline.** Extra IR capacity lets a manager hold an injured, role-secure player without consuming an active bench spot that could otherwise support in-season churn. This is corroborated as valuable specifically for players with an established role and realistic return window; it is far less valuable, and a documented misuse pattern, when applied to ambiguous long-term injuries or players without a secure path back to playing time. Some platforms also restrict transactions while an ineligible player occupies an IR slot, which can create unexpected roster friction — platform-specific IR eligibility rules (which designations qualify) vary and should not be assumed uniform.

**Replacement-level baselines must be recalculated for the league's exact roster shape rather than borrowed from generic published rankings.** A player's value-over-replacement depends on the specific number of required starters, flex slots and their eligible positions, and total roster depth (which determines how deep into the position's talent pool a "replacement" selection sits). Two leagues with identical scoring but different starting requirements (e.g., 2 WR + 1 flex vs. 3 WR + 2 flex) have materially different replacement baselines and are not interchangeable for valuation purposes.

**Deeper starting requirements compress positional tiers non-linearly, not proportionally.** Moving from 2 to 3 required WR starters, for example, does not uniformly raise WR value by 50% — it pushes the replacement baseline into a flatter, more saturated part of the WR talent distribution (since the WR pool is comparatively deep), while a similar increase in required RB or TE starters pushes into a much steeper drop-off because those positions have shallower usable depth. The steepness of a position's tier cliff, not just the raw starter count, determines how much added demand actually shifts draft value.

**Shallow leagues favor "stars and scarce depth" strategies; deep leagues favor role security and contingency value.** In shallow formats (fewer teams, fewer bench spots, or fewer required starters), the waiver-wire replacement level is high, meaning bench and depth investment carries low marginal value relative to maximizing starting-lineup ceiling. In deep formats, waiver replacement quality collapses, making workload security, handcuff value, and multi-week injury insurance considerably more important draft-day considerations.

**A common failure pattern is treating roster size as a pure draft-day concern rather than a season-long strategic variable.** Roster size and bench depth also govern in-season waiver activity, trade leverage (deep-bench teams can more easily absorb a depth-for-need trade), bye-week planning capacity, and tolerance for holding boom/bust or multi-week-injury players — all decisions that compound throughout a season rather than resolving at the draft.

## Key Decisions

The platform will calculate positional replacement-level baselines dynamically from each league's actual starting lineup configuration (starters, flex-eligible positions, and roster/bench size), rather than applying a single fixed replacement-rank assumption across all leagues, because the corroborated evidence is that identical scoring settings produce materially different value curves depending on lineup structure alone.

The platform will treat IR slot capacity as a depth-extension mechanism specifically for role-secure, realistically-returning injured players, and will flag IR usage on ambiguous or long-shot injury cases as a lower-value pattern, because sources converge that misusing IR as generic bench overflow is a documented inefficiency rather than a neutral roster decision.

The platform will weight bench depth as a first-class input to draft and waiver strategy recommendations (favoring streaming/waiver-activity guidance in shallow-bench leagues and contingency/handcuff guidance in deep-bench leagues), because the corroborated mechanism is that bench size directly determines waiver-wire liquidity and therefore the marginal value of speculative roster investment.

The platform will model tier-cliff steepness per position (not just raw required-starter counts) when assessing how additional lineup demand shifts positional value, because the corroborated evidence is that added demand affects shallow-pool positions (RB, TE) far more severely than deep-pool positions (WR) even at equivalent starter-count increases.

The platform will not adopt fixed numeric replacement-rank formulas (e.g., "replacement RB is exactly the Nth-ranked player") offered by individual models as settled figures, because the specific ranks varied by assumed league size, bench depth, and flex configuration with no single verifiable methodology across sources. Directional and structural guidance — that replacement level must be computed from the league's actual configuration — is adopted instead of a fixed formula. An alternative of adopting one model's specific formula as a universal default was considered and rejected, since it would misrepresent leagues with different roster shapes than the one that formula assumed.

## Open Questions

The precise numeric replacement-level rank for a given position under a specific starter/bench/flex combination is not established with a single verifiable, corroborated formula; models offered materially different specific-rank estimates depending on their assumed league parameters, so only a directional, configuration-dependent approach is adopted.

Whether handcuffing (rostering a starting running back's direct backup) is positive expected value is contested and appears conditional on the specific starter's workload concentration, goal-line role, and the presence of a clear lead-back successor — sources disagree on whether this generalizes across all elite backs or only a subset.

How much bench depth improves competitive outcomes versus primarily reducing waiver-wire activity and information flow across a league is raised as an open, unresolved tension without a settled answer.

Whether positional scarcity should be modeled statically (preseason replacement assumptions) or dynamically (updated in-season based on actual waiver availability and role changes) is raised as a genuinely contested modeling question, with sources noting dynamic models are more accurate in-season but more sensitive to short-term noise.
