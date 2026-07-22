# ARCHIVE.md
Condensed key decisions and outcomes from session logs rotated out under the 5-file log cap (MASTER_CONTEXT.md Session-End Steps). Full verbose content is not retained.

---

## 2026-07-21_01 — Wave 1 scaffold (01_foundation.md items 1–6, folded with Nick's approval)

- Folded all six scaffold items into one session (Nick approved via AskUserQuestion); npm chosen as package manager.
- create-next-app refuses non-empty dirs → scaffolded in scratchpad with `--skip-install`, merged only app files into repo root; excluded scaffold's .git/.gitignore/README/CLAUDE.md/AGENTS.md (would clobber governance loader). Package renamed "fantasy".
- shadcn CLI 4.13.1 dropped `--base-color`; used `init -y -d --css-variables` (preset base-nova, neutral). components.json: cssVariables true, iconLibrary lucide, @/ aliases.
- Font token chain fix: layout's Geist variable renamed to `--font-sans` so shadcn's `@theme inline` mapping resolves.
- Replaced boilerplate page.tsx (inline hex violated Design Token Discipline) with token-only shell that doubles as verification: @/ alias import, lucide icon, tabular-nums.
- Discovered `.gitignore` bare `logs` pattern ignored `.claude/logs/` — flagged rather than fixed unilaterally (later resolved: `!.claude/logs/` negation, see MANUAL_SETUP_CHECKLIST decisions of record).
- Verification: `npm run build` clean, `npm run lint` zero warnings, zero inline hex in src/, zero console.log.
- WIKI NOTE: none.
