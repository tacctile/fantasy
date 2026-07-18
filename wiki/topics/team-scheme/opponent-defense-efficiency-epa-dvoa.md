---
title: "Opponent Pass/Run Defense Efficiency (EPA/DVOA)"
type: domain-knowledge
category: team-scheme
status: active
last_updated: "2026-07-17"
confidence: high
tags:
  - epa
  - dvoa
  - defense-efficiency
  - pass-rate
  - explosive-play-rate
  - game-script
  - qb-rush-rate
related:
  - team-scheme/defense-vs-position
  - team-scheme/vegas-implied-team-total
  - team-scheme/red-zone-efficiency-team
  - player-evaluation/qb-epa-cpoe
---

## Summary

Expected Points Added (EPA) and Defense-adjusted Value Over Average (DVOA) are the two dominant advanced defensive efficiency families, and while both consistently outperform raw yards or points allowed as matchup predictors, every model in this synthesis is emphatic that they are distinct, non-interchangeable metrics built on different foundations — EPA is a points-based, play-state valuation while DVOA is a success/value-over-average measure with opponent adjustment built directly into its construction. Neither metric should be read as a single per-play number in isolation: pairing EPA/play with success rate and explosive-play rate is required to distinguish a defense that is consistently mediocre from one that is generally sound but leaking occasional big plays, and both metrics are highly sensitive to how a provider classifies sacks, scrambles, and RPO plays as pass or run.

## Core Knowledge

### Expected Points Added (EPA)

EPA measures the change in a model-derived expected-points value from before a play to after it:

$$\text{EPA} = \text{EP}_{\text{after}} - \text{EP}_{\text{before}}$$

The underlying expected-points ($$\text{EP}$$) model assigns a value to every down/distance/field-position/time/score-state combination based on historical league outcomes. Defensive EPA is generally represented as the inverse of offensive EPA — the value the offense generated against that defense — so a more negative defensive EPA allowed indicates a stronger defense:

$$\text{Pass Defense EPA/Play} = \frac{\sum \text{EPA on Opponent Dropbacks}}{\text{Opponent Dropbacks}}$$

$$\text{Run Defense EPA/Play} = \frac{\sum \text{EPA on Opponent Designed Runs}}{\text{Opponent Rush Attempts}}$$

The consistently recommended denominator for pass-defense EPA is dropbacks (pass attempts plus sacks plus, in most models, scrambles), not raw pass attempts alone — pass attempts undercount the passing game by excluding sacks and scrambles, which materially understates true pass-defense sample size and can distort the resulting rate.

### DVOA

DVOA compares a team's play-by-play performance against a league-average baseline in the same situational context (down, distance, field position, score state, and other game-state variables), then applies an opponent-strength adjustment:

$$\text{DVOA} = \frac{\text{Play Value Relative to League Average in Same Situation}}{\text{League-Average Value in That Situation}} \times \text{Opponent Adjustment}$$

For defense, negative DVOA indicates better-than-average performance (the defense is allowing less value than the league-average defense would in the same situations), and positive DVOA indicates worse-than-average performance — a sign convention that is easy to invert accidentally and should be handled with an explicit, disclosed label rather than left implicit. DVOA's opponent adjustment is iterative/recursive in nature and takes a meaningful portion of a season (commonly cited as roughly 6-8 games) to stabilize; DVOA in the first several weeks of a season carries materially more uncertainty than the same metric later in the year, since the opponent-strength baseline it depends on is still forming.

### EPA vs. DVOA: Complementary, Not Interchangeable

The core distinction repeated across responses: EPA is directly tied to scoring value and is more transparent and reproducible (particularly through open-source implementations), but it is not opponent-adjusted by default and is more responsive to recent, single-game variance. DVOA is opponent-adjusted and situationally normalized by construction, making it more stable as a season-long team-strength evaluator, but its exact methodology is generally proprietary, less transparent, and updates on a delayed publication schedule rather than being available immediately after each game. Analysts are described as genuinely divided on which is superior for short-term, week-to-week matchup forecasting specifically — EPA reacts faster to real, current-week defensive form; DVOA is more stable and controls better for the difficulty of the schedule a defense has actually faced.

### Success Rate and Explosive-Play Rate as Required Companions

EPA/play alone can be dominated by a small number of extreme outcomes — a single long touchdown or a turnover swings the average significantly, especially over a small sample. Success rate (the share of plays that meet a situational success threshold, generally tied to gaining a meaningful fraction of the yards needed for the down) captures down-to-down consistency independent of these tail events:

$$\text{Success Rate} = \frac{\text{Successful Plays}}{\text{Total Plays}}$$

The combination is diagnostic: a defense with poor EPA but a decent success rate is likely leaking occasional explosive plays while otherwise defending consistently (an explosive-play vulnerability that specifically elevates a receiver's ceiling); a defense with a poor success rate but tolerable EPA may be allowing steady gains without much explosiveness (favoring drive-sustaining, volume-based production over big plays). Run-defense EPA in particular is identified across responses as substantially noisier week-to-week than pass-defense EPA, heavily influenced by a small number of explosive runs, and single-game run EPA is repeatedly flagged as close to unusable without at least a multi-game sample.

### Classification Choices That Materially Change the Numbers

The single largest source of cross-provider disagreement in this category is how ambiguous play types are classified, and these choices are described as capable of shifting a defense's ranking by several spots:

- **Sacks** are generally treated as pass plays (failed dropbacks) by most serious analysts, but treatment is inconsistent across public and proprietary datasets.
- **Quarterback scrambles** are classified inconsistently — some models charge them to pass defense (since they originate from a broken or covered pass play), others to run defense (since the ultimate play type is a rush); this single classification choice can shift a defense's pass-EPA ranking by several places.
- **RPO plays that resolve as handoffs** are charted as run or pass depending on provider convention, affecting both pass- and run-defense figures for RPO-heavy opponents specifically.
- **Garbage-time filtering** varies by provider — some exclude plays outside a defined competitive win-probability band (commonly cited as roughly 5-95% or 10-90%), others use score-margin-based cutoffs, and some apply no filter at all, which can make a defense playing extensive "prevent" coverage in blowouts look worse than its competitive-snap performance actually reflects.
- **Opponent-adjustment methodology** differs in both approach (recursive/iterative vs. simple schedule-based regression) and update cadence, meaning two providers' "opponent-adjusted EPA" or DVOA figures for the same defense in the same week are not directly comparable without confirming both used the same underlying method.

### Platform and Provider Differences

- **Open-source play-by-play-derived EPA** (via public nflfastR-style datasets) offers the most transparent, independently verifiable methodology and is the reference implementation many independent analysts check other sources against, but requires the user to apply their own garbage-time and classification filters.
- **DVOA** (historically Football Outsiders, currently continued under FTN) is proprietary, is not fully reproducible by outside users, and updates on a delayed (commonly mid-week) publication schedule rather than being immediately available after games — a meaningful limitation for early-week lineup decisions but less relevant for players who set lineups closer to game time.
- **Charting-and-grading-based providers** (PFF and similar) incorporate proprietary intermediate states (receiver separation, pass-rush pressure, "expected" completion probability) into their efficiency figures, which can be more powerful for projection but introduces additional model risk and reduces direct comparability to a pure play-outcome-based EPA figure.
- **Tracking-data providers** (Next Gen Stats and similar) offer complementary diagnostic metrics — pressure rate, time to throw, coverage separation, box counts — that help explain *why* a defense's EPA or DVOA looks the way it does (pass-rush-driven vs. coverage-driven efficiency), which single-number efficiency metrics cannot distinguish on their own.
- **No provider publishes a single figure that is simultaneously fully transparent, opponent-adjusted, and updated in real time** — every option involves a tradeoff among these three properties, and serious matchup analysis is described as requiring at least two complementary sources (a transparent play-level efficiency source and an opponent-adjusted source) rather than relying on one.

### Edge Cases, Failure Patterns, and Pitfalls

- **Turnover sensitivity.** Interceptions and fumbles generate large EPA swings and can dominate a defense's efficiency figure over a small sample even when the underlying pass-rush and coverage quality driving those turnovers is otherwise ordinary; turnover-driven EPA gains should be discounted unless supported by corroborating pressure or coverage indicators, since turnover rates are known to regress toward the mean.
- **Game-script confounding.** A defense playing with a lead can be more aggressive (blitzing, playing tighter man coverage), artificially lowering its pass EPA allowed, while a defense playing from behind is forced into softer, more conservative coverage that inflates pass EPA allowed — neither reflects the defense's efficiency under a neutral, competitive game state. The standard correction across responses is to compute a neutral-script variant (commonly: competitive score margin, first three quarters, excluding late-game "prevent" situations) as a check against the full-game figure.
- **The pressure-vs-coverage attribution gap.** Two defenses can post similar pass-EPA-allowed figures for entirely different reasons — one through an elite pass rush against otherwise ordinary coverage, another through elite coverage without much pressure — and these represent materially different matchups for different player types (a pressure-driven defense is a tougher matchup for immobile quarterbacks and slow-developing routes; a coverage-driven defense specifically suppresses receiver efficiency even when the quarterback has time). Aggregate EPA/DVOA does not distinguish between these mechanisms on its own.
- **Field-position and special-teams contamination.** A defense's efficiency figure can be influenced by field position generated by its own offense's turnovers or special-teams performance, which is not a direct reflection of the defense's per-play quality and can distort the figure independent of actual defensive performance.
- **Red-zone and short-yardage aggregation loss.** A defense can be efficient in general-field situations while being specifically vulnerable near the goal line (or the reverse), and a single blended EPA or DVOA figure spanning the whole field conceals this distinction, which matters disproportionately for touchdown-dependent running back and quarterback evaluation.
- **Model drift and non-standardization.** Expected-points models are trained on historical data and can become less representative as league-wide strategy evolves (increased fourth-down aggressiveness, rule changes, shifting pass rates); since no single EP model is a universal standard, raw cross-provider EPA comparisons are not safe without confirming both sources use comparable model construction.
- **Bye-week and injury lag.** Efficiency ratings computed over a full season or a rolling multi-game window can lag a defense's actual current-week strength following a major injury (particularly at cornerback, edge rusher, or interior defensive line) or a coordinator/personnel change, since the historical sample underlying the figure predates the change.

## Key Decisions

- **Decision:** The platform will surface EPA/play and success rate together as a paired figure for both pass and run defense, rather than displaying EPA/play alone.
  **Reasoning:** Every response identifies EPA/play in isolation as vulnerable to distortion by a small number of explosive plays or turnovers, and pairing it with success rate is the consistently recommended correction to distinguish consistent defensive quality from high-variance outcomes.
  **Rejected alternative:** Displaying EPA/play as a standalone figure was rejected because it would present a metric known to be dominated by tail events with the same apparent confidence as a more stable, consistency-oriented statistic.

- **Decision:** The platform will explicitly disclose its classification convention for sacks, quarterback scrambles, and RPO handoffs within pass- and run-defense EPA calculations, and will use dropbacks (not raw pass attempts) as the denominator for pass-defense efficiency.
  **Reasoning:** Classification of these play types is the largest identified source of cross-provider disagreement, capable of shifting a defense's ranking by several spots, and dropback-based denominators are consistently identified as the more complete and accurate unit for pass-defense sample size.
  **Rejected alternative:** Using raw pass attempts as the denominator without disclosing scramble/sack treatment was rejected because it silently undercounts the passing game and produces figures that cannot be reliably compared against other sources' methodology.

- **Decision:** The platform will surface both a full-game and a neutral-script (competitive score margin, early-game) variant of pass and run defense EPA, rather than a single full-game figure only.
  **Reasoning:** Game-script confounding — aggressive defense when leading, soft coverage when trailing — is consistently identified as a major distortion on full-game efficiency figures, and the neutral-script variant is the standard correction for estimating a defense's efficiency independent of the specific game states its schedule happened to produce.
  **Rejected alternative:** Displaying only a blended full-game figure was rejected as conflating genuine defensive quality with score-state-driven behavior that will not necessarily recur against a different opponent.

- **Decision:** The platform will treat DVOA and EPA as complementary rather than substitutable inputs, weighting DVOA more heavily for season-long team-strength evaluation and EPA more heavily for capturing recent, current-form defensive changes, particularly early in a season before DVOA's opponent adjustment has stabilized.
  **Reasoning:** Sources are explicitly divided on which single metric is superior for short-term prediction, and the underlying reason is structural — DVOA's opponent adjustment provides stability but lags real-time change, while EPA is more current but not opponent-adjusted by default — making the two genuinely complementary rather than redundant.
  **Rejected alternative:** Selecting a single metric (EPA or DVOA exclusively) as the platform's sole defensive-efficiency signal was rejected because it would discard the specific strength the other metric provides, given that no source identifies either as strictly dominant across all use cases.

## Open Questions

- [ ] How should quarterback scrambles be classified for platform purposes — charged to pass defense (origin of the play) or run defense (final play type)? — genuinely unresolved across providers, with real downstream ranking consequences; needs an explicit, disclosed platform convention rather than a claim of correctness.
- [ ] What is the correct opponent-adjustment methodology, and how quickly should it be trusted to stabilize within a season? — DVOA-style recursive adjustment is described as taking roughly 6-8 games to stabilize, but no source offers a rigorously validated threshold.
- [ ] Can EPA or DVOA be decomposed into pressure-driven versus coverage-driven components using available public data, to distinguish these materially different matchup types? — identified as a real analytical gap; current public data does not cleanly support this decomposition without proprietary tracking data.
- [ ] How much incremental predictive value does defensive EPA/DVOA retain once Vegas implied team totals and player props already incorporate much of the same game-environment information? — flagged as an open and practically significant question with no settled answer across sources.
