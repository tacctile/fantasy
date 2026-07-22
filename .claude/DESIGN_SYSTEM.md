# DESIGN_SYSTEM.md
**Satellite context file — colors, typography, spacing, and component patterns**

**Parent:** `.claude/MASTER_CONTEXT.md`

**Last Updated:** 2026-07-22 (palette reconciliation fold: the Color System's values are now LIVE in `src/app/globals.css` — single always-on dark token set applied, `--radius` resolved via Nick-signed Clarify, pill-button and input-well component patterns applied to the vendored primitives)

---

## Status

`src/app/globals.css` now carries the final Sleeper-derived values below — applied 2026-07-22 by the palette reconciliation fold. The scaffold's light `:root` block and achromatic `.dark` block are deleted; the single always-on dark token set lives in `:root`, and a permanent `dark` class on `<html>` (see `layout.tsx`) keeps the vendored shadcn `dark:`-variant tunings active — it is a marker, never a toggle. Live-verified on `/login` (teal pill CTA with dark text, well-filled inputs, tinted card over `#12141c`). Update this file at session end whenever tokens change, per `MASTER_CONTEXT.md`'s Session-End Steps.

---

## Theme Mode — Dark Mode Only (final)

This app ships **dark mode only**. There is no light theme, now or planned — this is a final decision, not a Wave 1 shortcut.

- Only the `.dark` token set is built and maintained. Do not build a `:root`/light token set, a `.light` class, a theme toggle, or any `prefers-color-scheme` light-mode fallback.
- If a light-mode `:root` block exists in `globals.css` from the shadcn scaffold default, it is dead weight to be removed — `.dark` (or an equivalent single always-on token set) is the only theme that should exist in the codebase.
- No component, page, or future build file should branch on theme — there is only one theme.

## Live Token Set (src/app/globals.css)

- **Mechanism:** Tailwind v4 CSS-first theming — no `tailwind.config.*` file exists. `@theme inline` in `globals.css` maps Tailwind color/radius utilities onto shadcn CSS variables; values are defined once (all oklch, zero hex) as the single dark theme — no separate light block. (Mechanism unchanged by the color decisions below — only the token *values* change.)
- **Color tokens:** `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--warning`, `--positive`, `--well`, `--border`, `--input`, `--ring`, `--chart-1`..`--chart-5`, `--sidebar` family (the last three net-new tokens landed 2026-07-22 with `@theme inline` mappings `--color-warning`/`--color-positive`/`--color-well`)
- **Base palette:** Sleeper-derived tinted-dark palette — see "Color System (final)" below. Applied in code 2026-07-22; the shadcn achromatic-neutral placeholder is gone.
- **Radius (resolved — Nick-signed Clarify, 2026-07-22):** `--radius: 0.625rem` stays. Containers reach the 12–16px band via the derived `--radius-xl` step (base × 1.4 = 14px) that shadcn's Card already uses; buttons and chips are fully-rounded pills (`rounded-full` in `button.tsx`; badges were already pill) and never consume the base value. Derived `--radius-sm`..`--radius-4xl` remain multiples of the base.
- **Fonts:** Geist on `--font-sans` (registered in `layout.tsx` via `next/font`), Geist Mono on `--font-geist-mono` (mapped to `--font-mono`)

---

## Color System (final — Sleeper-derived, replaces shadcn neutral placeholder)

Synthesized from a 6-model research pass on Sleeper's UI/UX mechanics. These are concrete token values, not a placeholder palette — live in `globals.css`'s single `:root` set as of 2026-07-22. Oklch values below are direct conversions of the researched hex approximations; the compiler's hex serialization confirms them (`--background: #12141c`, `--primary: #21cea0`, `--destructive: #ff5964`, `--warning: #ffb545`).

### Base surfaces — tinted dark, never neutral black

Elevation expressed via lightness steps only. **No drop shadows. No/minimal border strokes for separation** — this is a deliberate reversal of default shadcn card treatment (shadcn cards typically rely on a `--border` stroke; here, lightness contrast against `--background` does that job instead).

| Token | Value | Role |
|---|---|---|
| `--background` | `oklch(0.193 0.017 273.8)` | App background — deep desaturated blue-black (≈`#12141C`), hue ~230°, ~19% lightness |
| `--card` | `oklch(0.245 0.020 273.8)` | Elevated surface (cards) — 1–2 lightness steps up from background, same hue |
| `--popover` | `oklch(0.290 0.022 273.8)` | Further elevated (modals/sheets) — 1 more step up from `--card` |
| *(new token)* `--well` | `oklch(0.155 0.015 273.8)` | Deepest wells (inputs, inset areas) — darker than `--background`; add this token, no shadcn equivalent exists by default |

### Accent — teal, restrained

| Token | Value | Role |
|---|---|---|
| `--primary` | `oklch(0.759 0.147 168.6)` | Teal-mint (≈`#23CEA0`) — primary CTAs, active/selected tab state, live indicators, positive deltas ONLY. Never decorative, never on non-interactive/non-"live" surfaces. |
| `--primary-foreground` | `oklch(0.193 0.017 273.8)` (same as `--background`) | **Dark navy text ON teal fill — not white.** Get this right: primary buttons read as dark text on a teal pill, the reverse of typical shadcn primary-button contrast. |

### Status colors (semantic, separate from brand accent)

| Token | Value | Role |
|---|---|---|
| `--destructive` | `oklch(0.689 0.201 20.4)` | Coral-red (≈`#FF5964`) — loss, injury-severe (O/IR) |
| *(new token)* `--warning` | `oklch(0.824 0.150 73.7)` | Amber/gold (≈`#FFB545`) — questionable/day-to-day (Q/D) |
| *(new token)* `--positive` | same as `--primary`, `oklch(0.759 0.147 168.6)` | Win/live/positive-delta — green-teal family, shares the accent hue rather than a separate green |
| Bye week | no token — muted text only | Deliberately uncolored. Rule: color = live/actionable information; absence of color = absence of urgency. Render in `--muted-foreground`, never a status color. |
| Injury chip (Q/D/O/IR) | small colored letter/chip inline with player name, severity-scaled (`--warning` → `--destructive` as severity increases) | Never a full-row tint — the chip carries the color, not the row background. |

### Text hierarchy — opacity tiers of one color, not a gray palette

Replaces `--foreground`/`--muted-foreground` being two unrelated grays — both now derive from the same off-white at different alpha values.

| Token | Value | Role |
|---|---|---|
| `--foreground` | `oklch(0.96 0.005 273.8 / 96%)` | Primary text — white/off-white, ~92–100% opacity. Never pure `#FFFFFF`/`oklch(1 0 0)`. |
| `--secondary-foreground` | `oklch(0.96 0.005 273.8 / 65%)` | Secondary text — same off-white, ~60–70% opacity |
| `--muted-foreground` | `oklch(0.96 0.005 273.8 / 45%)` | Tertiary/meta/labels — same off-white, ~40–50% opacity |

`--card-foreground` and `--popover-foreground` map to `--foreground` (same primary-text tier, different surface).

### Supporting tokens (derived 2026-07-22 — values the tables above don't name, declared per Rule 12 and recorded here as the decision of record)

The shadcn token surface is wider than the researched palette. These derivations follow the documented principles (white-at-low-opacity secondary treatment; no/minimal hairline strokes; teal = interactive):

| Token | Value | Derivation |
|---|---|---|
| `--secondary` | `oklch(0.96 0.005 273.8 / 10%)` | "White-at-low-opacity fill" per the secondary-button pattern; also the platform badge fill |
| `--muted` | `oklch(0.96 0.005 273.8 / 8%)` | Hover/skeleton surface — one step subtler than `--secondary` |
| `--accent` / `--accent-foreground` | `oklch(0.96 0.005 273.8 / 10%)` / `var(--foreground)` | shadcn hover/highlight surface (select items) — low-opacity white, never teal (teal = active/live only) |
| `--border` | `oklch(0.96 0.005 273.8 / 10%)` | Hairline, off-white hue (the "minimal" in no/minimal strokes) |
| `--input` | `oklch(0.96 0.005 273.8 / 12%)` | Input hairline border + disabled fill; the input *fill* itself is `--well` (see Reconciliation Notes) |
| `--ring` | `var(--primary)` | Focus rings are interactive state → teal (components apply it at `/50`) |
| `--sidebar` family | aliases: `--card`/`--foreground`/`--primary`/`--accent`/`--border`/`--ring` equivalents | Nothing consumes them yet; 1:1 aliases prevent drift when a sidebar ships (Wave 4) |

### Charts

`--chart-1` = `--primary` (teal, positive framing); `--chart-2` = `--destructive` (coral, negative framing). Smooth/monotone lines with a soft gradient fill beneath, minimal/no gridlines or axes, annotation-light — not a dashboard/enterprise chart style. This is a styling constraint on whichever charting library gets picked in Wave 5 (library choice itself remains open), not a library recommendation.

## Token Discipline

- Reference CSS variables per shadcn convention (`--background`, `--foreground`, `--radius`, etc.), defined in `globals.css` (`@theme inline` — Tailwind v4 has no `tailwind.config` here).
- Zero inline hex values in new components. If a color isn't available as a token, add it to the token set first.

## Scale Discipline

- Spacing comes from Tailwind's default scale only. No arbitrary pixel values.

## Radius Discipline

- Radius via shadcn's `--radius` CSS variable, consumed by component variants. Not a fixed custom scale.

## Icon Library

- `lucide-react` — standard shadcn pairing, already available in the build environment.

## Animation Governance

- 60fps minimum. Test on lower-spec hardware.
- Prefer CSS transitions for simple state changes (hover, active, focus).
- Use `requestAnimationFrame` only for continuous rendering loops (live score updates, real-time draft board changes).

## Data Display Convention

- Tabular numbers on all data displays: `font-variant-numeric: tabular-nums`.

---

## Device Targets (final)

- **Admin surface** (draft board, dashboard, eye-candy, tools) — **PC/tablet primary.** This is what Nick uses for live draft-day assistant work and in-season management. Mobile-usable but not optimized: this is an intentional long-term posture, not a Wave 1 shortcut to be revisited later.
- **Spectator surface** (share-link pages) — **mobile primary.** Leaguemates are assumed to open a shared link on a phone. Tablet/PC must still work but mobile is the actual design target every layout decision should be checked against.

## Aesthetic Direction (final — Sleeper-derived visual mechanics, named reference point for all future build sessions)

This section replaces the earlier generic "modern live-score app density" framing with concrete mechanics, synthesized from a 6-model research pass on Sleeper's UI/UX. These are final decisions, not placeholders.

**Admin surface — dense data-tool aesthetic.**
- Side-by-side stat comparisons; tabular data with heavy, consistent use of `tabular-nums`.
- Sparklines / inline trend indicators where useful (e.g. next to a score or ranking, not as standalone charts).
- Colored status chips for at-a-glance state (live / bye / injured / etc.), built from the Color System tokens above.
- Both the draft-day real-time view and in-season analysis/chart views are dense, but with different priorities: draft-day prioritizes speed/glanceability (live draft board, BPA sidebar, positional-need indicators), while in-season analysis prioritizes comparison depth (trend charts, luck visualization, positional breakdowns per Wave 5 scope). This distinction informs but does not dictate screen layout — layout itself remains a build-time decision.
- **Anti-reference:** Yahoo/ESPN-era fantasy UI — high clutter, low visual hierarchy, cramped rows, small text. Do not emulate this. Dense does not mean cluttered.

**Spectator surface — card-based, glanceable, chart-forward.**
- Card-based layout, generous spacing, mobile-first stacking.
- Chart-forward for any stats shown: line charts for trends, radar for positional breakdowns if used.
- Uses the mirrored head-to-head matchup pattern (below) as its centerpiece view.
- Should read as a clean mobile sports app, not a dashboard shrunk to fit a phone.
- Same color/type/component tokens as admin — just a less dense arrangement, not a different visual language.

## Typography (final)

- Hierarchy is driven primarily by **weight and text-opacity tier** (see Color System above), not dramatic size jumps. Most UI text lives in a narrow band (~13–17px), separated by weight: 400 / 600 / 800.
- Scores and point totals are the display type of this app — the largest, boldest text on any screen.
- All numeric data (scores, stats, projections, standings) gets `font-variant-numeric: tabular-nums` — non-negotiable, applies everywhere a number renders. This restates and reinforces the existing Data Display Convention below; the two are the same rule.
- Actual points: bold, full-opacity (`--foreground` tier). Projected points: smaller, `--muted-foreground` tier, positioned beneath or beside actual.
- Metadata lines (position · team · opponent/game-state): single line, small (~11–12px), medium weight, `--muted-foreground` tier, never wraps.

## Layout & Density (final)

- **Hybrid row-in-card pattern:** rows (avatar left, metadata middle, numbers right) grouped inside rounded card containers — not raw tables, not isolated cards per item. This is the default list pattern for rosters, matchup lists, free-agent results, etc.
- **True tabular/grid surfaces are the exception, not the default** — reserved for standings and the draft board only.
- Row height: 56–64px. Density target: ~7–10 player rows visible per mobile viewport.
- Spacing: 8pt grid. Card padding ~12–16px. Inter-card gaps ~8–12px. Section spacing ~16–24px. **Airiness lives inside components, tightness lives between them** — this is the core density trick that keeps a dense screen from reading as cluttered.
- Border radius: cards/containers 12–16px. Buttons and status chips are fully rounded (pill). Nothing sharp-cornered anywhere in this app.

## Head-to-Head Matchup View (core pattern — build precisely)

Mirrored two-column layout with a center spine. This is the spectator surface's centerpiece view and also used in-season on the admin surface.

- Team headers: your team left (avatar, name, big bold total), opponent right, mirrored.
- Below headers: a matchup bar showing current score vs. projected + win probability.
- One row per roster slot (QB, RB, RB, WR, WR, TE, FLEX…): your player left-aligned, opponent's right-aligned, slot label centered between them, points pinned to the **outer edges** of each side — this creates two vertical score columns readable straight down, so comparison happens across the centerline without needing two separate lists.
- Live score changes animate **in-place** (brief flash/pulse on the number itself) — never a full-row repaint or background flash. This follows the existing Animation Governance rule (60fps, prefer CSS transitions, `requestAnimationFrame` reserved for continuous loops).

## Component Patterns (final)

**Player row — the atomic unit, get this exactly right:**
- Circular headshot avatar (~40px).
- Line 1: player name (semibold, `--foreground` tier) + inline injury chip if applicable (Q/O/IR/D, severity-colored per Color System).
- Line 2: position · team · game context — single line, `--muted-foreground` tier.
- Right-aligned: actual points (bold, tabular, `--foreground`) with projected beneath (smaller, tabular, `--muted-foreground`).
- Roster views group under Starters/Bench/IR headers with a pinned totals footer.

**Buttons:**
- Primary: teal fill (`--primary`), fully-rounded pill, dark-navy text (`--primary-foreground`) — **not white text on teal.**
- Secondary: white-at-low-opacity fill or hairline outline, also pill-shaped.
- Tertiary: teal text only, no fill/border.
- Status/filter chips: always pills, colored per the Color System status rules above.

**Icons:** minimal, rounded, 1.5–2px stroke weight with round caps (consistent with `lucide-react`'s default style), used sparingly for nav/utility only. Content is text-labeled, not icon-only — no unlabeled icons for anything roster-affecting.

## Anti-patterns

- No light mode, no theme toggle, no light-mode fallback of any kind.
- Avoid dense tables on the spectator surface — that density belongs to the admin surface only (true tabular/grid layouts are reserved for standings and the draft board, per Layout & Density above).
- Avoid low-contrast text on dark backgrounds — verify contrast against the dark token set, not just against a neutral gray assumption. Never use pure `#FFFFFF`/`oklch(1 0 0)` for text; use the opacity-tiered off-white system instead.
- Avoid legacy-fantasy-platform visual clutter: small text, cramped rows, low hierarchy. This is the explicit anti-reference for the admin surface's density (see Aesthetic Direction above) — dense does not mean cluttered.
- No drop shadows for elevation — lightness steps only (background → card → popover → deeper than background for wells).
- No teal on decorative or non-interactive surfaces — if it isn't clickable or "live," it isn't teal.
- No full-row color tints for injury/status — the chip carries color, never the row background.
- No unlabeled icons for anything roster-affecting.
- No sharp corners anywhere — cards/containers 12–16px radius, buttons/chips fully pill-shaped.

## Reconciliation Notes — APPLIED 2026-07-22 (palette reconciliation fold)

Every delta this section previously listed is now applied in `src/app/globals.css`; this is the record of how each resolved:

- `--background`/`--card`/`--popover` → the tinted blue-black values above (hue ~273.8°). Scaffold light `:root` block and achromatic `.dark` block deleted; the single always-on set lives in `:root`, with a permanent `dark` class on `<html>` keeping vendored `dark:`-variant tunings active.
- `--primary`/`--primary-foreground` → teal with dark-navy text, per spec. `--destructive` → `oklch(0.689 0.201 20.4)`.
- Text tiers re-derived as alpha steps of one off-white (96% / 65% / 45%), per the Text Hierarchy table.
- Net-new `--well`/`--warning`/`--positive` added with `@theme inline` mappings; supporting tokens derived and recorded in the Supporting Tokens table above.
- **`--radius` resolved (Nick-signed Clarify, 2026-07-22): base stays `0.625rem`.** Containers reach the 12–16px band via the `--radius-xl` step (14px) shadcn's Card already uses; buttons/chips are pills and never consume the base. The companion pattern edits were signed in the same Clarify: `button.tsx` base `rounded-lg` → `rounded-full` (per-size radius overrides removed), `input.tsx` fill → `bg-well` (the old `dark:bg-input/30` tint mathematically could never render darker than the card it sits on).
- **Still open (unchanged by this fold):** `--chart-3`..`--chart-5` remain the scaffold's achromatic grays — unspecified by the decision set, inert until a chart needs more than two series (Wave 5).

## New Component Checklist

Every new component must:
- [ ] Have a TypeScript props interface (no `any`)
- [ ] Have a JSDoc comment describing purpose
- [ ] Be wrapped in an error boundary (major components)
- [ ] Use CSS variable tokens only — zero inline hex values
- [ ] Use Tailwind's default spacing scale — no arbitrary pixel values
- [ ] Use tabular numbers for data displays
- [ ] Handle loading/error/empty states for async operations
- [ ] Have a corresponding test file (goal — not yet enforced for all)

---

_End of DESIGN_SYSTEM.md_
