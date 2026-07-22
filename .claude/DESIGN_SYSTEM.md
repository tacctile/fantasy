# DESIGN_SYSTEM.md
**Satellite context file — colors, typography, spacing, and component patterns**

**Parent:** `.claude/MASTER_CONTEXT.md`

**Last Updated:** 2026-07-21

---

## Status

Wave 1 scaffold landed the shadcn default token set (neutral base, oklch color space) in `src/app/globals.css`. These are the working starting values — they get tuned against real UI as Wave 1+ builds actual surfaces, but the mechanism and names below are now live, not placeholders. Update this file at session end whenever tokens change, per `MASTER_CONTEXT.md`'s Session-End Steps.

---

## Live Token Set (src/app/globals.css)

- **Mechanism:** Tailwind v4 CSS-first theming — no `tailwind.config.*` file exists. `@theme inline` in `globals.css` maps Tailwind color/radius utilities onto shadcn CSS variables; `:root` and `.dark` blocks define the values (all oklch, zero hex).
- **Color tokens (light + dark variants):** `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-1`..`--chart-5`, `--sidebar` family
- **Base palette:** shadcn neutral (achromatic oklch), dark mode via `.dark` class (`@custom-variant dark`)
- **Radius:** `--radius: 0.625rem`; derived `--radius-sm`..`--radius-4xl` computed as multiples of `--radius`
- **Fonts:** Geist on `--font-sans` (registered in `layout.tsx` via `next/font`), Geist Mono on `--font-geist-mono` (mapped to `--font-mono`)

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
