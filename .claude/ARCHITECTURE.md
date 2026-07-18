# ARCHITECTURE.md
**Satellite context file — detailed directory structure, systems, and APIs**

**Parent:** `.claude/MASTER_CONTEXT.md`

**Last Updated:** 2026-07-18

---

## Status

No application code exists yet. This file's inventory sections (Source Directory Structure, Service API Reference, Type Definitions, Build Configuration, CI/CD Pipeline, Testing Infrastructure, Supabase Infrastructure, Environment Variables) are populated as Wave 1 and later waves actually build things — not fabricated in advance. Update this file at session end whenever structure changes, per `MASTER_CONTEXT.md`'s Session-End Steps.

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
