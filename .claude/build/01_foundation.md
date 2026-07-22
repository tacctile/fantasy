# 01_foundation.md
**Wave 1 — Foundation**
**Status:** ⬜ Not started
**Registered:** 2026-07-21

---

## Scope

Supabase schema (with `league_id`, `platform`, `season_year`, Sleeper-anchored player identity, `league_config`, `share_token` per `MASTER_CONTEXT.md` Schema Rules), env/secrets setup, initial Vercel deploy. Nothing beyond this — no ingestion logic, no ESPN cookie auth flow, no RLS spectator-read policies (those are Wave 4's concern once the spectator surface actually exists). This wave proves the schema is correct and the app deploys; it does not populate real data.

This build file was scoped by convergence-filtering 6 independent AI model responses (chathub-style panel) against the project's actual `BUILD_INDEX.md` Wave 1 bullet, per the same methodology used for `wiki/` discovery ingestion. Full panel responses are not retained here — this file is the synthesized, project-scoped result.

---

## WIKI PAGES TO CONSULT

Read these before starting, per Session-Start Protocol (max 3 unless the task genuinely needs more):

- `wiki/topics/schema-reference/league-identity-and-scoping.md` — `platform_league_uuid` primary-key pattern, `previous_platform_league_uuid` continuity
- `wiki/topics/schema-reference/player-identity-mapping.md` — Sleeper-anchored crosswalk table shape and population order
- `wiki/topics/schema-reference/league-configuration-data-model.md` — `league_config` raw + derived column shape

---

## Checklist

### Project scaffold
- [ ] Initialize Next.js (App Router, TypeScript strict, `src/` directory) via `create-next-app`
- [ ] Configure `tsconfig.json` so `@/*` resolves to `src/*` — verify with one trivial cross-directory import
- [ ] Install and initialize shadcn/ui; configure `components.json` for CSS-variable theming
- [ ] Configure `globals.css` with shadcn token set (`--background`, `--foreground`, `--radius`, `--card`, `--border`, etc.) — zero inline hex anywhere
- [ ] Install `lucide-react` as the sole icon library
- [ ] Confirm Tailwind default spacing scale only (no arbitrary pixel values) and `font-variant-numeric: tabular-nums` available for data displays

### Supabase project + migration workflow
- [ ] Create the Supabase project; capture `SUPABASE_URL`, anon key, service-role key
- [ ] Install Supabase CLI, `supabase login`, `supabase link` to the project
- [ ] `supabase init` to establish the local `supabase/migrations/` directory as the canonical schema-change path
- [ ] Confirm the baseline-migration rule is understood: never edit the baseline directly, always `supabase migration new` for every subsequent change (this applies from Wave 1 onward, permanently)

### Schema — platform + identity foundation
- [ ] Migration: `platform` Postgres enum type, values `sleeper` and `espn` (extensible enum, never a boolean)
- [ ] Migration: `players` table, `sleeper_player_id` (text) as primary key, plus name/position/team/status/metadata columns — this is the Sleeper-anchored canonical identity store, per `schema-reference/player-identity-mapping.md`
- [ ] Migration: ESPN↔Sleeper player crosswalk table (`espn_player_id` → `sleeper_player_id`, unique per platform+external ID) — never a parallel identity system, per the same wiki page

### Schema — league + config
- [ ] Migration: `leagues` table — internal primary key, `platform` enum, `season_year`, display name, `share_token` (text, unique, not null), owner reference, timestamps. No fixed league-count assumption anywhere in schema or code.
- [ ] Migration: `share_token` generation — Postgres function using `pgcrypto`/`gen_random_bytes` (or equivalent) producing a cryptographically random, unguessable token; trigger or column default so every league row gets one automatically at creation. Must be revocable/regeneratable later (Wave 4 concern for the regenerate UI, but the schema must not prevent it — no immutability constraint on this column beyond not-null+unique).
- [ ] Migration: `league_config` table, keyed by `league_id`, storing scoring settings and roster slots as JSONB ("raw" provider-native shape), plus a small derived/normalized subset (PPR value, TE-premium flag, superflex flag, slot counts) — per `schema-reference/league-configuration-data-model.md`. Never hardcode scoring/roster assumptions in application code.

### Schema — league-scoped state
- [ ] Migration: `rosters` table — `league_id`, `platform`, `season_year`, team/roster identifiers, owner metadata
- [ ] Migration: `roster_players` (or equivalent join) — resolves to `sleeper_player_id`, never a platform-specific player ID directly
- [ ] Migration: `matchups` table — `league_id`, `platform`, `season_year`, week, participant/score fields
- [ ] Migration: `standings` table — `league_id`, `platform`, `season_year`, wins/losses/points-for/points-against
- [ ] Migration: `player_scores` table — composite scoping on `(league_id, sleeper_player_id, season_year, week)`, since fantasy value is never a single global number (Schema Rule #1)

### Schema — draft state (shared, not staged)
- [ ] Migration: `draft_state` table, keyed by `league_id` — pick number, round, drafted `sleeper_player_id`, target roster, `source` (`manual` | `espn_poll`), timestamps, unique constraint on `(league_id, pick_number)` for first-write-wins semantics. Both manual click-to-draft (built in Wave 3) and ESPN live polling (also Wave 3) will write to this single table — no separate code paths, no staged manual-first/poller-later sequencing. This table only needs to exist correctly in Wave 1; the write logic itself is Wave 3.

### Schema — integrity
- [ ] Add foreign keys from every league-scoped table back to `leagues`, and from every player-scoped table back to `players.sleeper_player_id`
- [ ] Add indexes on `league_id`, `platform`, `season_year`, `sleeper_player_id`, `share_token`, and the ESPN crosswalk's external-ID column
- [ ] Enable Row Level Security on every table created this wave. Write owner-only write policies (single admin, `auth.uid()` match). Do NOT build share_token-based spectator read policies yet — that's Wave 4 scope, once the spectator surface exists to actually use them; Wave 1 only needs RLS *enabled* with owner-write policies so nothing is silently open by default.

### Types + client wiring
- [ ] Generate TypeScript types from the live schema (`supabase gen types typescript`) into a committed types file
- [ ] Create Supabase client utilities: browser client, server client (RSC/route-handler), both typed against the generated schema — named exports, per Code Conventions

### Env, secrets, deploy
- [ ] Create `.env.local` (gitignored) and a committed `.env.example` with placeholders for Supabase URL/anon key/service-role key. ESPN `espn_s2`/`SWID` placeholders included in `.env.example` now even though ESPN auth flow itself is Wave 2 — the env contract should exist before the wave that consumes it.
- [ ] Create Vercel project, link to the repository
- [ ] Configure Supabase secrets in Vercel (Production + Preview environments)
- [ ] Trigger initial Vercel deploy — confirm build succeeds
- [ ] Add a minimal server-side health-check route that performs a trivial authenticated Supabase read, to prove the deployed environment (not just local) can actually reach the database — this is the wave's actual completion gate, not just "build succeeded"

---

## Explicitly NOT in this wave

- ESPN cookie-auth flow / credential storage (Wave 2)
- Any Sleeper or ESPN data ingestion/sync logic (Wave 2)
- Share-token-gated spectator RLS read policies or the spectator route surface itself (Wave 4)
- Manual or automated draft-pick write logic (Wave 3) — only the `draft_state` table shape is created here
- Any UI beyond the default scaffolded shell needed to prove the deploy works

---

## Session-End requirements (per COMPLETION_TEMPLATES.md)

Use the `feature-build` report template. Update `STATE.yml` completely, log to `.claude/logs/`, update this file's checklist items, update `ARCHITECTURE.md`'s inventory sections (they're currently placeholders — this is the wave that first populates them) and `DESIGN_SYSTEM.md`'s token values (currently placeholders — Wave 1 is where real token values get decided against a real UI, per that file's own Status note).
