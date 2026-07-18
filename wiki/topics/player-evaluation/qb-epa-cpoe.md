---
title: "QB EPA per Dropback / CPOE"
type: domain-knowledge
category: player-evaluation
status: active
last_updated: "2026-07-17"
confidence: medium
tags:
  - epa
  - cpoe
  - expected-value
  - efficiency
  - regression-baseline
  - opportunity
related:
  - player-evaluation/qb-designed-rush-scramble-rate
  - player-evaluation/expected-fantasy-points
  - player-evaluation/fantasy-points-over-expected
---

## Summary

Expected Points Added (EPA) per dropback and Completion Percentage Over Expected (CPOE) are the two dominant modern quarterback efficiency metrics: EPA per dropback captures the full situational value of every dropback outcome (completions, incompletions, sacks, scrambles, turnovers), while CPOE isolates throwing accuracy and decision-making by comparing actual completion rate to a model's expected completion rate given throw difficulty. Both are widely regarded as more predictive and more context-aware than legacy box-score stats like passer rating, but both are also confounded by supporting cast, scheme, and offensive line quality — the central, unresolved tension across all synthesis is the "attribution problem": no public model cleanly separates how much of a quarterback's EPA or CPOE reflects individual skill versus the talent and system around him.

## Core Knowledge

### EPA per Dropback: Definition and Calculation

Expected Points Added measures the change in a possession's expected scoring value from before a play to after it, where expected points is a historical model of how many points an offense scores on average from a given down, distance, field position, and (in more sophisticated versions) time and score state:

$$\text{EPA} = \text{Expected Points}_{\text{post-play}} - \text{Expected Points}_{\text{pre-play}}$$

$$\text{EPA per Dropback} = \frac{\sum \text{EPA on all dropbacks}}{\text{Total Dropbacks}}$$

Dropbacks conventionally include pass attempts, sacks, and scrambles, though this is not universally applied — some public models and platforms report EPA per pass attempt (excluding scrambles) or exclude certain penalty situations, and these differences are not cosmetic: because sacks carry a heavily negative EPA value, a quarterback's EPA per dropback can differ meaningfully depending on whether sacks are folded into the denominator. There is no single universal EPA model; academic and public frameworks (e.g., open-source play-by-play-derived models) and proprietary provider models (team-facing analytics vendors, PFF) use different underlying expected-points tables, and can diverge by a non-trivial margin (on the order of a few tenths of a point per dropback) for the same quarterback in the same season due to different treatment of garbage time, penalties, and field-position weighting.

### CPOE: Definition and Calculation

Completion Percentage Over Expected compares a quarterback's actual completion rate to a model-derived expected completion rate for the throws he actually attempted:

$$\text{CPOE} = \text{Actual Completion \%} - \text{Expected Completion \%}$$

The expected-completion model is typically a machine-learning model (logistic regression or gradient-boosted trees) trained on throw difficulty inputs: air yards/depth of target, receiver separation at the target location, distance to sideline, pressure on the quarterback, and whether the throw is into a contested window. A positive CPOE indicates the quarterback completed more passes than the difficulty of his throws would predict — a signal of accuracy and decision-making independent of whether his throws were easy or hard.

Because the expected-completion model is a statistical construct rather than an observed fact, CPOE is a *model output*, not a universal truth — different providers use different input features and different training data, and will produce different CPOE values for the same quarterback and the same throws.

### Platform and Provider Differences

- **NFL Next Gen Stats (NGS)** is the most widely cited public source for CPOE, using player-tracking data (receiver separation, defender proximity, throw velocity) to build its expected-completion model. NGS's tracking-based inputs make it more feature-rich than models built purely from charted air yards and pass location.
- **PFF** produces its own completion-over-expected-style grading, incorporating film-charted variables (contested-target status, accuracy grading independent of whether the receiver caught the ball) that differ from NGS's tracking-based approach. Because PFF's model weights ball placement and receiver-independent accuracy differently, its output can diverge from NGS's CPOE for the same quarterback, particularly on plays where drops or spectacular catches affect the raw outcome.
- **Open-source / public play-by-play models** (independent analysts building on public NFL play-by-play data) use simpler feature sets — typically air yards, pass location (left/middle/right), and basic context — because public data lacks the tracking coordinates that power NGS and proprietary models. These models are transparent and reproducible but generally less feature-rich, and are a common reference point for independent analysis specifically because of that transparency.
- **Sack, scramble, and garbage-time treatment** vary across all of the above: some platforms present raw, unadjusted EPA; others provide separate garbage-time-filtered views. Whether a given dashboard's headline EPA number includes garbage time materially affects how directly comparable it is across sources.

### Edge Cases, Failure Patterns, and Pitfalls

- **Scheme inflation.** Offenses built around heavy pre-snap motion, play-action, and manufactured openings (broadly, "YAC-scheme" offenses) can produce an inflated EPA per dropback driven by explosive run-after-catch yardage, while CPOE for the same quarterback may be flat or even negative if the throws themselves were low-difficulty and the model doesn't fully credit the scheme for creating easy completions. This is the clearest illustration of EPA and CPOE measuring different things: EPA captures total value including what receivers do after the catch; CPOE is meant to isolate throwing accuracy but is still influenced by how open the scheme makes receivers.
- **Garbage-time distortion.** In blowout win-probability extremes, defenses play soft, prevent-style coverage, allowing quarterbacks to accumulate inflated EPA and CPOE against a lower level of competition. Any serious evaluation should filter or separately flag garbage-time snaps rather than blending them into season-long averages.
- **Deep-ball penalty in CPOE.** Because expected completion rate is lower for deep throws by construction, a quarterback who throws a disproportionate share of intermediate-and-short passes has a higher expected-completion baseline and therefore a harder time posting a large positive CPOE, while a quarterback attacking deep more frequently can show a lower raw completion percentage yet a comparable or better CPOE once throw difficulty is accounted for. Comparing CPOE across quarterbacks with very different aDOT profiles without acknowledging this baseline effect is a common misread — a low-aDOT "game manager" profile can produce a deceptively strong CPOE built on easy throws.
- **Receiver-quality bias.** A quarterback throwing to receivers who consistently win contested targets or create yards after catch will see both EPA and CPOE elevated for reasons largely outside his own throwing accuracy — the tracking model registers a tight, low-probability window but the receiver's catch radius or contested-catch ability converts the play anyway, crediting the quarterback with efficiency that is partly receiver-driven.
- **Turnover and sack sensitivity in small samples.** EPA is highly sensitive to a small number of high-leverage events — interceptions carry a heavily negative EPA value, and a handful of turnovers or sacks can swing a season's EPA per dropback substantially. Sacks specifically can drag down the EPA of a quarterback playing behind a weak offensive line even when his passing-play efficiency is strong, which is why splitting EPA into pass-attempt EPA versus sack EPA is a more diagnostic (though less commonly presented) view than the blended figure.
- **Sample-size instability.** Both metrics require a substantial sample — commonly cited as at least 150–200+ dropbacks — before they stabilize. Small-sample stretches (a handful of games, or a backup quarterback's limited action) can produce EPA and CPOE values that look decisive but are not representative of underlying talent and are prone to significant reversion with a larger sample.

### Combining the Two Metrics

Because EPA and CPOE measure different things (total situational value versus pure accuracy-over-difficulty), reading them together produces a more diagnostic picture than either alone: high EPA paired with high CPOE is the strongest signal of efficient, sustainable quarterback play; high EPA with unremarkable or low CPOE can still reflect real value if driven by explosive plays, scheme design, or rushing production, but is less attributable to the quarterback's own accuracy; low EPA with high CPOE often describes a checkdown-heavy, low-explosive-play profile that completes easy throws without generating situational value; and low readings on both are a clear negative signal. For fantasy purposes, EPA per dropback is generally more useful for gauging the team's overall scoring environment and the quality of opportunity available to pass-catchers, while CPOE is more useful for assessing whether the quarterback's accuracy is likely to sustain the offense's drive efficiency independent of scheme — but neither metric predicts fantasy points well in isolation without volume, pace, and team pass-rate context layered in.

## Key Decisions

- **Decision:** The platform will present EPA per dropback and CPOE as complementary metrics, always shown together rather than as a single blended quarterback-quality score.
  **Reasoning:** The two metrics diverge meaningfully in what they measure (total situational value vs. throwing accuracy), and blending them into one number would discard the diagnostic value of seeing where a quarterback's profile splits (e.g., high EPA/low CPOE scheme-driven value vs. high CPOE/low EPA checkdown-heavy value).
  **Rejected alternative:** A single composite "QB efficiency score" was rejected because it would obscure the attribution problem rather than surface it, and because the two component metrics have different confounds that a blended score would not let users separate.

- **Decision:** The platform will filter or clearly flag garbage-time snaps in any EPA or CPOE view used for player evaluation.
  **Reasoning:** Both metrics are well-documented to inflate in low-competitiveness game states; presenting unfiltered season-long figures without this context risks overrating quarterbacks who padded stats against soft, non-competitive coverage.
  **Rejected alternative:** Relying on raw, unfiltered season totals was rejected because it conflates competitive and non-competitive performance in a way that misleads projection.

- **Decision:** The platform will treat quarterback EPA per dropback as a measure of offensive environment quality — useful for projecting pass-catcher opportunity — rather than as a pure, isolated quarterback talent grade.
  **Reasoning:** EPA is confounded by offensive line quality, receiver talent, and play-calling; using it as a talent-isolated ranking would systematically overrate quarterbacks with strong supporting casts and underrate quarterbacks on weaker rosters.
  **Rejected alternative:** Ranking quarterbacks purely by raw EPA per dropback as a proxy for individual skill was rejected because the metric does not control for supporting cast, which the platform's synthesis treats as a first-order confound rather than noise.

## Open Questions

- Can EPA be reliably decomposed into quarterback-controlled and context-controlled (offensive line, receiver talent, scheme) components in a way that becomes a standard, reproducible adjustment? Various "adjusted EPA" approaches have been attempted; none has become a consensus standard.
- Does CPOE have direct, quantifiable predictive value for pass-catcher fantasy production, independent of target volume? A quarterback completing a high percentage of a low-attempt sample is not obviously more valuable to his pass-catchers than a lower-CPOE quarterback throwing a much higher volume; the marginal value of CPOE for downstream WR/TE projection is not resolved.
- Should EPA per dropback include quarterback rushing plays (designed runs, not just scrambles within dropbacks) for fantasy-relevant evaluation, given the demonstrated predictive power of QB rushing volume? Most standard EPA definitions are pass-play-centric; a rushing-inclusive variant is straightforward to compute but not commonly presented by mainstream platforms.
- How much does EPA and CPOE stability change under a full offensive coaching-staff change (not just a coordinator swap)? Most cited stability findings assume a single-variable change (new QB or new OC); full-staff transitions are not systematically studied.

---

_End of qb-epa-cpoe.md_
