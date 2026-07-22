# ARCHITECTURE.md
**Satellite context file — detailed directory structure, systems, and APIs**

**Parent:** `.claude/MASTER_CONTEXT.md`

**Last Updated:** 2026-07-21

---

## Status

Wave 1 Project scaffold complete: Next.js app shell exists and builds. Remaining inventory sections (Service API Reference, Type Definitions, Supabase Infrastructure, Environment Variables, CI/CD Pipeline, Testing Infrastructure) are populated as Wave 1's later items and subsequent waves actually build things — not fabricated in advance. Update this file at session end whenever structure changes, per `MASTER_CONTEXT.md`'s Session-End Steps.

---

## Source Directory Structure

```
src/
  app/
    layout.tsx      — root layout; registers Geist (--font-sans) + Geist Mono (--font-geist-mono), imports globals.css
    page.tsx        — placeholder shell proving tokens/@-alias/lucide/tabular-nums; replaced by real surfaces in later waves
    globals.css     — Tailwind v4 entry + full shadcn token set (see DESIGN_SYSTEM.md)
    favicon.ico
  components/
    ui/             — shadcn-generated components (button.tsx so far); never hand-edited casually
  lib/
    utils.ts        — cn() class-merge helper (shadcn), named export
public/             — static assets (default scaffold SVGs, replaceable)
```

## Build Configuration

- **Next.js 16.2.11** — App Router, `src/` directory, Turbopack (default), TypeScript strict (`tsconfig.json`: `strict: true`, `isolatedModules: true`)
- **Path alias:** `@/*` → `./src/*` (tsconfig `paths`; verified by real cross-directory import)
- **Tailwind CSS v4** (`@tailwindcss/postcss`) — CSS-first config: no `tailwind.config.*` file; theme lives in `globals.css` via `@theme inline`. Default spacing scale only.
- **shadcn/ui** — CLI 4.x, `components.json`: style `base-nova`, `cssVariables: true`, base color neutral, `iconLibrary: lucide`, aliases `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`
- **ESLint** — flat config (`eslint.config.mjs`), `eslint-config-next`
- **Package manager:** npm (package-lock.json committed). Node 24.x locally.
- **Scripts:** `dev` (turbopack), `build`, `start`, `lint`

---

## Code Conventions

These conventions are declared in `MASTER_CONTEXT.md` and repeated here as the satellite reference. Follow them when adding or editing code; update both locations if either changes (Dual-Location Instruction Rule).

**Imports:**
- Cross-directory imports use the `@/` alias.
- Same-directory and sibling-directory imports use relative paths.
- Never use `@/` to reach a sibling file.
- Never use `../`-walking imports.

**Exports:**
- React components: default exports.
- Services, hooks, stores, utilities, types: named exports.
- Type-only exports: `export type`.

**Barrel exports (`index.ts`):**
- Directory-level public surface, where present.
- Import from the directory, not the file, when an `index.ts` exists.
- Re-export new public symbols from an existing `index.ts` rather than creating a new one.

**TypeScript:** no `any` without explicit justification.

**JSX runtime:** default React JSX runtime (Next.js standard, no custom pragma).

---

## Supabase Migration Rule

Never edit the baseline migration. All schema changes go through `supabase migration new`. This is a hard operational constraint, not a style preference — applies from Wave 1 onward.

---

_End of ARCHITECTURE.md_
