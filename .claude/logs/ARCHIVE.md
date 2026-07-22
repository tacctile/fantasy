# ARCHIVE.md
Condensed key decisions and outcomes from session logs rotated out under the 5-file log cap (MASTER_CONTEXT.md Session-End Steps). Full verbose content is not retained.

---

## 2026-07-21_04 — Build-file reconciliation vs external research (non-code; 03b/04/05 amendments)

- Trades/waivers amended into Wave 5, not a new build file: read-only analysis surfaces over data Wave 5 already assembles, reusing its positional-breakdown component; Wave 5 unstarted so zero rework. Matches Amendment Norm's "genuine requirement change" exception.
- Cross-cutting nav/IA split: Wave 4 owns the persistent sidebar shell + command-center home (new "Admin navigation shell" section); Wave 5 mounts into it and carries the cross-feature contextual-link guidance.
- 03b BPA section rewritten to the full VORP/VBD mechanism with a hard constraint: need stays a separate signal, never blended/multiplied into base value. Tier-cliff, run-detection, and queue/auto-pick added as net-new sections (queue Sleeper-only per instruction).
- Wave 5: presentation-layer edits only (luck/playoff calc logic untouched); playoff visuals explicitly non-probability-shaped (deterministic clinch/eliminate); unanimous chart anti-pattern list added as a standing constraint for the whole wave.
- Waiver/FAAB scoring formula NOT invented — marked DEFERRED in the checklist itself + nick_pending entry.
- PROGRESS.md not updated (scope amendment ≠ milestone). WIKI NOTE: none.

## 2026-07-21_03 — Manual-setup walkthrough (non-code, all five Wave 1 items cleared)

- Walked Nick through every open Wave 1 manual item one at a time: DB password reset + saved (`[~]`), Vercel project `fantasy` created and connected (`[x]`), Supabase env vars added to Vercel Production+Preview (`[x]`), admin auth decided — real email + Nick's own password, user not yet created (`[~]`), `.claude/logs/` gitignore negation approved (decision-only, applied later).
- `[x]` vs `[~]` reasoning: `[x]` when nothing is left to hand a future session; `[~]` when a real secret string exists but hasn't been consumed yet.
- Added "Decisions of record" section to MANUAL_SETUP_CHECKLIST.md for cross-cutting non-wave decisions.
- Lesson: lead credential walkthroughs with the exact page/button path, not "do you have this" — Nick had never been shown the DB password.
- PROGRESS.md not updated (no milestone). WIKI NOTE: none.

## 2026-07-21_02 — Wave 1 Supabase project + migration workflow (4 items, folded with Nick's approval)

- Credentials pulled via Supabase MCP connector (URL + publishable key); only the secret key needed a paste from Nick. Captured in gitignored `.env.local`.
- Modern publishable/secret key pair chosen over legacy anon/service_role JWTs (Nick's Clarify decision); env names `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`.
- Supabase CLI pinned as npm dev dep (supabase@2.109.1), invoked via `npx supabase`; Nick ran interactive `supabase login`; linked to `tszssadgsxjoymcttlwd`. DB password deliberately skipped at link (appended to MANUAL_SETUP_CHECKLIST as a new [ ] item; later handed over).
- Key validation quirk: Supabase rejects secret keys from browser-like user agents — Invoke-WebRequest got "Forbidden use of secret API key in browser"; curl.exe returned 200.
- Baseline-migration rule confirmed: first schema item creates the baseline via `supabase migration new`; nothing ever edits it after.
- PROGRESS.md updated (core infra activation milestone). WIKI NOTE: none.

## 2026-07-21_01 — Wave 1 scaffold (01_foundation.md items 1–6, folded with Nick's approval)

- Folded all six scaffold items into one session (Nick approved via AskUserQuestion); npm chosen as package manager.
- create-next-app refuses non-empty dirs → scaffolded in scratchpad with `--skip-install`, merged only app files into repo root; excluded scaffold's .git/.gitignore/README/CLAUDE.md/AGENTS.md (would clobber governance loader). Package renamed "fantasy".
- shadcn CLI 4.13.1 dropped `--base-color`; used `init -y -d --css-variables` (preset base-nova, neutral). components.json: cssVariables true, iconLibrary lucide, @/ aliases.
- Font token chain fix: layout's Geist variable renamed to `--font-sans` so shadcn's `@theme inline` mapping resolves.
- Replaced boilerplate page.tsx (inline hex violated Design Token Discipline) with token-only shell that doubles as verification: @/ alias import, lucide icon, tabular-nums.
- Discovered `.gitignore` bare `logs` pattern ignored `.claude/logs/` — flagged rather than fixed unilaterally (later resolved: `!.claude/logs/` negation, see MANUAL_SETUP_CHECKLIST decisions of record).
- Verification: `npm run build` clean, `npm run lint` zero warnings, zero inline hex in src/, zero console.log.
- WIKI NOTE: none.
