# ARCHITECTURE.md
**Satellite context file — detailed directory structure, systems, and APIs**

**Parent:** `.claude/MASTER_CONTEXT.md`

**Last Updated:** 2026-07-21

---

## Status

Wave 1 Project scaffold complete: Next.js app shell exists and builds. Supabase project + migration workflow section complete: project linked, credentials captured, `supabase/` workspace initialized. Remaining inventory sections (Service API Reference, Type Definitions, CI/CD Pipeline, Testing Infrastructure) are populated as Wave 1's later items and subsequent waves actually build things — not fabricated in advance. Update this file at session end whenever structure changes, per `MASTER_CONTEXT.md`'s Session-End Steps.

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

## Supabase Infrastructure

- **Project:** `tszssadgsxjoymcttlwd` — `https://tszssadgsxjoymcttlwd.supabase.co` (pre-existing per `MANUAL_SETUP_CHECKLIST.md`; linked 2026-07-21)
- **CLI:** `supabase@2.109.1` as npm dev dependency — invoked via `npx supabase`, version pinned in `package.json` so all three of Nick's environments resolve the same CLI
- **Local workspace:** `supabase/` (created by `supabase init`) — `config.toml` committed; `supabase/migrations/` is the canonical schema-change path once the first migration exists; `supabase/.temp/` (holds the linked project-ref) is gitignored by Supabase's own `supabase/.gitignore`
- **Link state:** linked to `tszssadgsxjoymcttlwd`; database password was deliberately not provided at link time — the first `supabase db push` session must ask Nick for it (tracked in `MANUAL_SETUP_CHECKLIST.md` Wave 1)
- **API keys:** standardized on the modern key pair — publishable (`sb_publishable_...`) for client-side, secret (`sb_secret_...`) for server-side — not the legacy anon/service_role JWTs. Both validated live against `rest/v1/` (secret key returns 200 with a non-browser client; Supabase actively rejects secret keys sent from browser-like user agents). No schema, tables, or migrations exist yet.

## Environment Variables

Live values in gitignored `.env.local`; the committed `.env.example` contract is a later Wave 1 checklist item (not yet created).

| Variable | Exposure | Purpose |
| -------- | -------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server | modern publishable key (replaces legacy anon JWT) |
| `SUPABASE_SECRET_KEY` | server only — never `NEXT_PUBLIC_` | modern secret key (replaces legacy service_role JWT) |

## Supabase Migration Rule

Never edit the baseline migration. All schema changes go through `supabase migration new`. This is a hard operational constraint, not a style preference — applies from Wave 1 onward.

---

_End of ARCHITECTURE.md_
