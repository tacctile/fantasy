---
title: "Team Pass Rate / Pass Rate Over Expected (PROE)"
type: domain-knowledge
category: team-scheme
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - pass-rate
  - proe
  - offensive-scheme
  - oc-tendencies
  - opportunity
  - regression-baseline
related:
  - team-scheme/neutral-game-script-pass-rate
  - team-scheme/pace-of-play
  - player-evaluation/target-share
  - in-season-management/coaching-staff-changes-mid-season
---

## Summary

Pass Rate Over Expected (PROE) isolates a team's scheme-driven passing tendency from situation-driven variance by comparing actual pass rate to a model-predicted expected pass rate given down, distance, score differential, time remaining, and field position. It is treated across all available synthesis as superior to raw pass rate for scheme evaluation, because raw pass rate is heavily contaminated by game script (trailing teams pass more, leading teams run more, independent of underlying philosophy). PROE is not standardized across providers — the expected-pass model's features, the classification of scrambles and sacks, and the handling of garbage time all vary — and it should function as an input to opportunity forecasting alongside pace and route participation, never as a standalone player projection.

## Core Knowledge

### Definition and Calculation

Raw team pass rate is the share of offensive plays that are pass plays:

$$\text{Pass Rate} = \frac{\text{Pass Attempts}}{\text{Pass Attempts} + \text{Rush Attempts}}$$

PROE compares this actual rate to a model-derived expectation:

$$\text{PROE} = \text{Actual Pass Rate} - \text{Expected Pass Rate}$$

The expected-pass component is built from a play-level probability model (commonly logistic regression or gradient-boosted trees) trained on league-wide play-by-play data, estimating the probability of a pass on every individual snap given situational features — down, distance, field position, score differential, time remaining, and quarter/half are the near-universal core inputs; some more sophisticated models add personnel grouping, formation, pre-snap motion, opponent defensive tendency, or timeout status. At the play level, if $p_i$ is the expected pass probability for play $i$:

$$\text{Expected Pass Rate} = \frac{1}{N}\sum_{i=1}^{N} p_i \qquad \text{PROE} = \frac{1}{N}\sum_{i=1}^{N} P_i - \frac{1}{N}\sum_{i=1}^{N} p_i$$

where $P_i$ equals 1 for an actual pass and 0 for a run. A positive PROE indicates the team passed more often than the model expected given its exact situations across the sample; a negative PROE indicates more running than expected.

A distinction that matters for fantasy application: pass rate over expected is not the same as pass *attempts* over expected. A team can call passes at a high rate but generate fewer completed dropbacks because of sacks, aborted snaps, or penalties, and receiver opportunity is more tightly linked to pass attempts and routes run than to the raw called-play rate. Quarterback rushing value (scrambles, designed runs) further complicates the picture — a scramble-heavy, pass-first quarterback can be structurally penalized by models that classify scrambles as rushing plays, understating true offensive pass intent.

### Platform and Provider Differences

There is no single, universally standardized PROE statistic; the label is shared across the industry, but the underlying model and play-classification rules vary meaningfully by source:

- **Expected-model specification.** Some public models (commonly built on open-source play-by-play data, e.g., the nflfastR ecosystem) condition primarily on down, distance, score, and time. More sophisticated proprietary models (associated with providers like Next Gen Stats, PFF, and fantasy-specific analytics shops) may add personnel grouping, formation, and opponent-defense features. A model incorporating formation may treat a shotgun empty-backfield snap as strongly pass-expected; a simpler model may not, which shifts what counts as a positive or negative residual for the same play.
- **Scramble classification.** This is the single most-cited source of cross-provider disagreement. Official statistics record a quarterback scramble as a rushing play, but strategically the play was called as a pass. Models that classify scrambles as rushes will show a lower observed pass rate (and can materially understate PROE) for mobile, scramble-prone quarterbacks; models that treat scrambles as pass-intent plays produce a different, generally higher, strategic pass tendency for the same team.
- **Sack and dropback treatment.** Whether the denominator is pass attempts plus rush attempts, or dropbacks (pass attempts plus sacks) plus rush attempts, changes the resulting rate — these are not interchangeable formulations, and sources are not always explicit about which they use.
- **Play inclusion/exclusion.** Kneel-downs, spikes, aborted snaps, and plays nullified by penalty are excluded by some sources and retained by others; in low-play-volume samples (a single game, or early season), these inclusion decisions can shift a team's reported PROE noticeably.
- **Situational filtering and aggregation window.** Some providers publish full-game PROE; others publish early-down-only, first-half-only, or neutral-script-only variants under the same "PROE" label, which are not directly comparable to each other or across providers without confirming which is being reported.

Because of this fragmentation, cross-provider PROE rankings should not be assumed comparable without first confirming both sources use matching play-inclusion rules and a similar expected-pass model; within-provider trend analysis (tracking one source's number over time) is the more defensible use.

### Edge Cases, Failure Patterns, and Pitfalls

- **Small-sample instability.** PROE stabilizes slowly — moderate reliability is commonly cited as requiring on the order of 6-8 games of data — and is prone to large swings from a single extreme-game-script outing (a blowout in either direction, or an unusual sequence of short-yardage or garbage-time plays). Week-to-week PROE should not be used for roster or lineup decisions; rolling multi-game windows are the standard mitigation.
- **Positive PROE does not guarantee good fantasy conditions.** A team can show positive PROE because it is inefficient on early downs, cannot sustain a run game, is trailing structurally due to poor defense, or has an offensive line that cannot protect — all of which can produce passing *volume* without corresponding efficiency or touchdown upside. PROE measures tendency, not offensive quality.
- **The mobile-quarterback distortion.** As noted above, scramble classification structurally penalizes (or in some model formulations, inflates) PROE for dual-threat quarterbacks whose designed-pass-turned-scramble plays don't cleanly map to either called-play category. This is a well-documented, unresolved measurement gap rather than a true reflection of offensive philosophy.
- **Personnel and injury confounding.** A team missing a top running back will typically pass more as a *situational* response, not a philosophical shift; PROE models that don't account for active-roster composition can misattribute this as a change in coaching intent.
- **Quarterback and coordinator changes invalidate season-long baselines.** A team's PROE reflects the specific quarterback, offensive coordinator, and personnel in place when it was measured; season-long or prior-year PROE should be heavily discounted or reset following a coaching change, quarterback change, or major offensive-line turnover, since the expected-vs-actual relationship the model learned may no longer describe the current offense.
- **Red-zone instability.** PROE calculated across the whole field should not be projected directly into the red zone — the field is compressed, run-pass distribution shifts, and goal-to-go play-calling follows a distinct logic; red-zone-specific PROE (where available) is a materially different and noisier signal.
- **Circularity with defensive strength.** A team whose own defense is unusually strong may face more positive game scripts overall, lowering its raw pass rate; if the expected-pass model absorbs most of that shift as "expected," the residual PROE may understate how pass-heavy the offense would be in a neutral matchup. Whether and how to further adjust for opponent-defense strength when interpreting PROE is unresolved (see Open Questions).

### Fantasy Application

For receiver opportunity forecasting, PROE functions as one input in a larger multiplicative chain, not a final answer:

$$\text{Targets} \approx \text{Team Plays} \times \text{Pass Rate (PROE-adjusted)} \times \text{Route Participation} \times \text{Targets per Route Run}$$

Positive, persistent PROE is treated as stronger evidence of a receiver-friendly offense when the tendency holds across multiple game states (both leading and trailing), across different opponents, and with the same quarterback/coordinator in place — a PROE reading driven by a single extreme comeback, a backup quarterback stretch, or an unusual run of blowouts should be weighted with lower confidence.

## Key Decisions

- **Decision:** The platform will treat PROE as one input to a multi-factor opportunity model (alongside pace, route participation, and target distribution), never as a standalone receiver or quarterback projection.
  **Reasoning:** All available synthesis converges on PROE describing pass *tendency*, not offensive quality or individual player opportunity; treating it as sufficient on its own would ignore well-documented cases where positive PROE coexists with poor fantasy conditions (inefficiency, poor offensive line, structural trailing).
  **Rejected alternative:** Using PROE alone as a receiver-environment ranking signal was rejected because it discards the pace, efficiency, and target-concentration factors that determine whether pass volume actually reaches a given player.

- **Decision:** The platform will require a minimum multi-game rolling sample (on the order of 4-6 games, consistent with the general role-stability standard used elsewhere in the wiki) before treating PROE as a stable team signal, and will explicitly reset confidence following a quarterback or offensive-coordinator change.
  **Reasoning:** Convergent guidance across sources places PROE's stabilization point at roughly 6-8 games, and a coaching or quarterback change invalidates the expected-vs-actual relationship the underlying model learned from prior data.
  **Rejected alternative:** Using season-to-date or full-prior-season PROE without a recency/change-adjustment was rejected because it would treat pre- and post-change data as equally informative when they reflect different offensive systems.

- **Decision:** The platform will document and expose which play types (scrambles, sacks, kneel-downs, penalty-nullified plays) are included in any PROE figure it surfaces, rather than presenting a bare percentage.
  **Reasoning:** Scramble and sack classification is the most consequential and most inconsistently handled source of cross-source disagreement documented in this synthesis; presenting PROE without disclosing these inclusion rules would make the platform's own figures non-comparable to external sources users may reference.
  **Rejected alternative:** Adopting a single internal classification convention without disclosure was rejected because it would silently diverge from whatever convention a user is mentally comparing against from another source.

## Open Questions

- Does PROE primarily measure coaching preference/philosophy, or adaptive response to opponent tendencies, quarterback strengths, and rushing-game inefficiency? The metric detects behavior but does not identify cause, and this is flagged as a central unresolved tension across sources.
- What is the correct target variable for a fantasy-oriented expected-pass model — pass attempts, dropbacks, designed pass calls, or receiver targets directly? These are related but not identical, and a model optimized for general play classification may not be optimal for receiver-opportunity projection specifically.
- Should expected-pass models be opponent-adjusted (accounting for the specific defense's run/pass tendencies), and if so, by how much? No standardized adjustment exists, and sources disagree on whether opponent effects are worth correcting for or wash out over a season.
- How should scrambles be definitively classified for PROE purposes — as passes (reflecting play-call intent) or rushes (reflecting outcome)? This is repeatedly flagged as unresolved and materially affects results for mobile-quarterback offenses specifically.
- Should team-identity/team-fixed-effects be included in the expected-pass model? Including it may better capture known coaching tendencies but reduces the metric's usefulness for detecting genuine philosophical change; excluding it risks misclassifying established team-specific behavior as unexplained deviation.

---

_End of proe.md_
