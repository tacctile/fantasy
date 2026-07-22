# ARCHITECTURE.md
**Satellite context file — detailed directory structure, systems, and APIs**

**Parent:** `.claude/MASTER_CONTEXT.md`

**Last Updated:** 2026-07-21

---

## Status

Wave 1 Project scaffold complete: Next.js app shell exists and builds. Supabase project + migration workflow section complete: project linked, credentials captured, `supabase/` workspace initialized. Schema — platform + identity foundation section complete: `platform` enum, `players`, and `player_id_crosswalk` are live in the database (verified 2026-07-21). Schema — league + config section complete: `leagues`, `generate_share_token()`, and `league_config` are live (verified 2026-07-21). Remaining inventory sections (Service API Reference, Type Definitions, CI/CD Pipeline, Testing Infrastructure) are populated as Wave 1's later items and subsequent waves actually build things — not fabricated in advance. Update this file at session end whenever structure changes, per `MASTER_CONTEXT.md`'s Session-End Steps.

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

- **Project:** `tszssadgsxjoymcttlwd` — `https://tszssadgsxjoymcttlwd.supabase.co` (linked 2026-07-21). **This is Nick's shared multi-app "prolabel" project, not a fantasy-dedicated one** — it hosts live tables and data from several other apps (todd chat, elliott pricing, trip planner, loan/valuation) plus 2 pre-existing auth users. Confirmed intentional by Nick 2026-07-21; see Shared-Database Constraints below and the decision of record in `MANUAL_SETUP_CHECKLIST.md`.
- **CLI:** `supabase@2.109.1` as npm dev dependency — invoked via `npx supabase`, version pinned in `package.json` so all three of Nick's environments resolve the same CLI
- **Local workspace:** `supabase/` (created by `supabase init`) — `config.toml` committed; `supabase/migrations/` is the canonical schema-change path once the first migration exists; `supabase/.temp/` (holds the linked project-ref) is gitignored by Supabase's own `supabase/.gitignore`
- **Link state:** linked to `tszssadgsxjoymcttlwd`; database password handed over 2026-07-21 as `SUPABASE_DB_PASSWORD` in gitignored `.env.local`. Note: a project-level Bash allow rule for `npx supabase db push*` (`.claude/settings.json`, added 2026-07-21 with Nick's approval) lets Claude run migration pushes directly; the CLI reads `SUPABASE_DB_PASSWORD` from the environment (sourced from `.env.local` in-shell, never echoed). The connector's `apply_migration` remains blocked — pushes go through the CLI.
- **API keys:** standardized on the modern key pair — publishable (`sb_publishable_...`) for client-side, secret (`sb_secret_...`) for server-side — not the legacy anon/service_role JWTs. Both validated live against `rest/v1/` (secret key returns 200 with a non-browser client; Supabase actively rejects secret keys sent from browser-like user agents).

## Database Schema (live)

Fantasy-owned objects in the shared `public` schema, all created via `supabase migration new` + push (migration files in `supabase/migrations/`):

- **`platform`** — Postgres enum, values `sleeper` | `espn` (extensible via `alter type ... add value` in a new migration; never a boolean)
- **`players`** — Sleeper-anchored canonical identity store. `sleeper_player_id text` PK (text, never numeric — D/ST rows use team abbreviations like `'DET'`), `full_name`/`first_name`/`last_name`/`position`/`team`/`status`/`injury_status`/`search_full_name` text, `fantasy_positions text[]`, `search_rank integer`, `birth_date date`, `metadata jsonb`, timestamps. All non-PK columns nullable (Sleeper field presence is uneven). `status` and `injury_status` are independent fields that must be read together (see `sleeper-api/player-data-quirks`); no `bye_week` column by design — byes derive from team schedule at read time. RLS enabled (deny-by-default; policies come with the Wave 1 integrity item)
- **`player_id_crosswalk`** — mapping layer keyed on `sleeper_player_id` (PK, FK → `players` on delete cascade); nullable text columns `espn_player_id`, `gsis_id`, `yahoo_id`, `sportradar_id`, `pfr_id`; partial unique index on `espn_player_id` where not null. RLS enabled. Population pipeline is Wave 2
- **`leagues`** — league identity root. `platform_league_uuid uuid` PK (default `gen_random_uuid()`) — the value every league-scoped table's `league_id` FK points to; never a provider's native ID. `platform` enum, `season_year integer`, `native_league_id text` (stored as-received, re-query/debug only, never a join key), `previous_platform_league_uuid` nullable self-FK on delete set null (Sleeper `previous_league_id` chain resolved at ingestion; always null for ESPN), `name text`, `share_token text` not null unique (default `generate_share_token()`), `owner_id uuid` nullable FK → `auth.users(id)` on delete set null (backfilled when the integrity item creates the admin user), timestamps. Unique `(platform, native_league_id, season_year)` — one row per platform-season-league combination. RLS enabled (deny-by-default; policies come with the Wave 1 integrity item)
- **`league_config`** — league configuration as data (Schema Rule #5), shape per the `schema-reference/league-configuration-data-model` ADR. `league_id uuid` PK doubling as FK → `leagues.platform_league_uuid` on delete cascade (1:1 extension of the league row — `platform`/`season_year` deliberately not duplicated; the parent row carries both). `scoring_settings_raw jsonb` + `roster_settings_raw jsonb` (provider-native payloads stored as-received: Sleeper `scoring_settings`/`roster_positions`+settings, ESPN scoring payload/`lineupSlotCounts`), `derived_config jsonb` (normalized subset — PPR value, TE-premium flag, superflex flag, active/bench/IR slot counts, league size — computed at ingestion and re-derived on every refresh; derivation is Wave 2), all three not null; timestamps. RLS enabled (deny-by-default; policies come with the Wave 1 integrity item)
- **`generate_share_token()`** — returns 32 random bytes hex-encoded (64 chars, 256 bits) via `extensions.gen_random_bytes` (pgcrypto, pre-installed on the shared project); `search_path = ''`. Default on `leagues.share_token`; revocation/regeneration is a plain UPDATE — no immutability constraint
- **`set_updated_at()`** — shared trigger function (`search_path = ''`), `before update` trigger on all four tables

## Shared-Database Constraints (prolabel)

The database is shared with other live apps. Standing rules for every future session:

- **Never run `supabase db reset`** against the linked project — it would destroy other apps' live data.
- **Never run `supabase migration repair`** — it edits the shared `supabase_migrations.schema_migrations` ledger and would erase other apps' history rows.
- The 23 pre-existing foreign history versions are mirrored as empty `*_prolabel_shared_history_stub.sql` files in `supabase/migrations/` so `db push` recognizes remote history without writing to it. If a future push refuses because new foreign versions appeared remotely, add another empty stub for each — never repair.
- Fantasy table names must not collide with existing prolabel tables; check `list_tables` before naming a genuinely new table family.
- Owner-write RLS policies must match Nick's specific `auth.uid()`, never the blanket `authenticated` role — the auth namespace contains other apps' users.

## Environment Variables

Live values in gitignored `.env.local`; the committed `.env.example` contract is a later Wave 1 checklist item (not yet created).

| Variable | Exposure | Purpose |
| -------- | -------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client + server | modern publishable key (replaces legacy anon JWT) |
| `SUPABASE_SECRET_KEY` | server only — never `NEXT_PUBLIC_` | modern secret key (replaces legacy service_role JWT) |
| `SUPABASE_DB_PASSWORD` | CLI only — never shipped | database password for `supabase db push` (read by the Supabase CLI) |

## Supabase Migration Rule

Never edit the baseline migration. All schema changes go through `supabase migration new`. This is a hard operational constraint, not a style preference — applies from Wave 1 onward.

---

_End of ARCHITECTURE.md_
