# DESIGN_SYSTEM.md
**Satellite context file — colors, typography, spacing, and component patterns**

**Parent:** `.claude/MASTER_CONTEXT.md`

**Last Updated:** 2026-07-18

---

## Status

Actual color/token values are decided in Wave 1 against a real UI, not fabricated here in advance. This file documents the *mechanism* fantasy's token system follows; the token set itself gets filled in as Wave 1+ builds components. Update this file at session end whenever tokens change, per `MASTER_CONTEXT.md`'s Session-End Steps.

---

## Token Discipline

- Reference CSS variables per shadcn convention (`--background`, `--foreground`, `--radius`, etc.), defined in `globals.css` and extended via `tailwind.config`.
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
