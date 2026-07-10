# claude.md — tetris

Game-specific working instructions for Claude Code. This game inherits the monorepo contract: read the root [`spec.md`](../spec.md), the root [`claude.md`](../claude.md), and this game's [`spec.md`](spec.md) before acting on any prompt. Where documents disagree, the monorepo `spec.md` wins unless a deviation is declared in `tetris/spec.md`.

---

## Overview

`tetris` is a classic single-player Tetris built to modern-guideline rules with a neon dark aesthetic.

- 10×20 playfield (plus 2 hidden buffer rows for spawn/top-out). Seven tetriminos with the **Super Rotation System** and wall kicks (clockwise and counter-clockwise). **7-bag** randomizer, **ghost piece**, **lock delay** (0.5 s, ≤ 15 move-resets).
- **Hold** slot swaps the active piece, capped at **10 uses per run**, with the standard no-consecutive-hold rule. A **5-piece** next queue.
- **15 levels** with a variable line goal. Progression is measured in **credited lines**: special actions grant more than their physical count (Tetris = 8, T-Spin Double = 12, …). The starting level absorbs the cumulative requirement `5·N·(N+1)/2`; later levels require `5·L`; finishing level 15 always totals **600**.
- Full scoring: line clears × level, **Mini/T-Spins**, **Back-to-Back**, **combos**, **Perfect Clear**. Soft/hard drop points. Match history splits points into **regular** vs **bonus**.
- Five states: `IDLE → PLAYING → PAUSED → GAME_OVER`, plus a terminal `VICTORY` on completing level 15.
- Bilingual (English / Spanish), sound with a mute toggle, local match history (50 runs, 10/page, all-time best pinned). **Dark-only — no theme toggle.**
- Static frontend only — **no backend**. Multiplayer is a documented future consideration only (see `spec.md`), not built.

---

## Working style (game-specific notes)

All monorepo rules apply (spec-first, stage discipline, no magic values, English code, i18n-only UI strings, input validation, security). In addition:

- **Tests are the contract and are locked.** The unit tests under `frontend/src/**/__tests__/` (and `src/i18n/__tests__/`) were written in Stage 2 and define the public API of every logic layer (`T-BRD`, `T-ROT`, `T-BAG`, `T-TSP`, `T-SCORE`, `T-PROG`, `T-LOCK`, `T-HOLD`, `T-ST`, `T-HIST`, `T-LS`, `T-I18N`). Do not add or modify a test without explicit developer authorization; if a feature needs a new test, add its definition to `spec.md` first.
- **The engine is pure and deterministic.** Every function in `engine/`, `rotation/`, `randomizer/`, `scoring/`, `history/`, `state/transitions.ts` and `validation/` returns a new value from its inputs — no DOM, no timers, no randomness read from a clock. `dt` (ms) and `rng` are injected by the caller. The 7-bag `rng` is injectable specifically so it can later be **seeded** for multiplayer.
- **`useTetris` is the only bridge between logic and React.** The `requestAnimationFrame` loop, keyboard/touch input (DAS/ARR), the lock timer, gravity, audio, and all `localStorage` side effects live there — not in components or the pure modules.
- **Game logic never lives in components.** Components render the controller's `state` snapshot and call its actions. `Board` is presentation: it reads `board`/`active`/`ghost` and draws.
- **i18n key sets stay identical.** `en.json` and `es.json` must always have the same keys with non-empty values (guarded by `T-I18N-01/02`). Add new keys to both. **No hardcoded user-visible strings** — the mock's Spanish labels are illustrative only.
- **Dark-only.** There is no theme toggle and no `theme` preference; do not reintroduce one.

---

## Directory map

```
tetris/
├── spec.md                 # Game contract — source of truth for tetris
├── claude.md               # This file
├── readme.md               # Local dev / test / deploy guide
├── design/                 # Claude Design handoff (reference only; not built)
│   ├── Tetris.dc.html  reference.png  readme.md
├── frontend/
│   └── src/
│       ├── components/      # React UI only: App, Board, PieceGrid, HoldPanel, NextQueue,
│       │                    #   StatsPanel, Header, TouchControls, Overlays, StartScreen,
│       │                    #   Scoreboard, ControlsModal, LanguageToggle, MuteToggle, format
│       ├── i18n/            # en.json, es.json, config.ts (i18next setup; exports en/es)
│       ├── layouts/         # Layout.astro
│       ├── pages/           # index.astro (renders <App client:only="react" />)
│       ├── styles/          # global.css (neon dark palette, responsive, scanline, @font-face)
│       └── lib/
│           ├── constants/   # pieces, srs, levels, scoring, game, input, ui, storage,
│           │                #   preferences — all literals here
│           ├── engine/      # board.ts (create/collision/lock/clearLines/perfect/ghost),
│           │                #   piece.ts (cells per type+rotation, spawn), lock.ts (dt-driven)
│           ├── rotation/     # srs.ts (rotate + tryRotate with kick index)
│           ├── randomizer/   # bag.ts (7-bag, injectable rng)
│           ├── scoring/      # scoring.ts (points + regular/bonus split), progression.ts
│           │                #   (credited lines, goal, gravity, level-up), tspin.ts (detectSpin)
│           ├── history/      # records.ts (buildRecord, addRecord w/ prune + pinned best)
│           ├── audio/        # sfx.ts (AudioManager: SFX + music + mute; placeholder files)
│           ├── state/        # transitions.ts (pure FSM + GameState factory), hold.ts,
│           │                #   useTetris.ts (the controller)
│           └── validation/   # localStorage.ts (validatePrefs/validateScores), result.ts
│   └── public/              # fonts/ (self-hosted woff2 — pending), audio/ (mp3 — pending)
└── infra/                   # CDK app (GameStack) — see infra/readme.md
```

Architecture is **layer-based extended with domain folders** (the spec's declared choice), mirroring space-explorer.

---

## How to modify game rules or add a feature

1. **Update `spec.md` first.** Add or change the relevant Gherkin scenario and, if logic is affected, the unit-test definition. Log the decision in the Decisions Log. Get developer authorization (stage discipline still applies).
2. **Adjust/extend tests** (only with authorization) to cover the new behavior.
3. **Implement in the logic layer** as pure functions; keep every literal in `lib/constants/`.
4. **Wire it through `useTetris`** (`lib/state/useTetris.ts`), then surface it in components.
5. **Add any new UI strings** to both `i18n/en.json` and `i18n/es.json`.
6. **Validate:** `npm run test --workspace tetris/frontend`, then `npm run typecheck --workspace tetris/frontend`, then `npm run build --workspace tetris/frontend`.

If a change contradicts an existing scenario or decision, stop, update the documentation first, then change the code.

### Key invariants to preserve

- The engine stays pure and `dt`/`rng`-driven (no `Date`/`performance.now`/`Math.random` inside `engine`/`rotation`/`randomizer`/`scoring`/`history`/`state/transitions`). Wall-clock time and randomness live only in `useTetris`.
- The tested `rotate(board, piece, dir)` keeps its signature; `tryRotate` (same file) additionally returns the kick index used, which `useTetris` needs to distinguish a full T-Spin (index-4 kick upgrades a Mini).
- **T-Spin** is only detected for the `T` piece when the last successful action before lock was a rotation (3-corner rule; both front corners or the last kick → full, else mini).
- **Regular/bonus split:** plain line clears (Single..Tetris base) and soft/hard drop points are *regular*; T-Spin/Mini action totals, the B2B increment, combo and perfect-clear points are *bonus*. Match history stores both.
- **Back-to-Back** is sustained only by difficult clears (Tetris, T-Spin line clears, Mini T-Spin line clears); a non-difficult clear breaks it, a no-clear move does not. Its bonus is `0.5 ×` the action total (points) and `0.5 ×` the action's credited value (progression).
- **Level goal** = `5·N·(N+1)/2` for the starting level `N`, then `5·L`; `applyProgress` carries the remainder across level-ups and always totals 600 to finish level 15.
- Hold consumes one of 10 uses, cannot be used twice before the piece locks, and is disabled at 0.
- The in-progress `GameState` is **never** persisted; only `tetris_prefs` and `tetris_scores` are. The all-time best survives history pruning.

---

## Assets pending (not code)

- **Fonts:** `public/fonts/orbitron.woff2` and `space-grotesk.woff2` (self-hosted per the CSP). `@font-face` in `global.css` references them; the CSS falls back to system fonts until they exist. Fetch fresh from Google Fonts — do not extract from the design bundle.
- **Audio:** SFX/music `.mp3` under `public/audio/`. `AudioManager` maps events to these paths and swallows missing files, so the mute toggle and event hooks already work.

---

## Security checklist

- [ ] `tetris_prefs` and `tetris_scores` parsed through `validatePrefs` / `validateScores`; invalid prefs reset to defaults, invalid/garbage records are discarded individually (non-array resets all), `startLevel` is clamped to `1..15`, and a visible warning banner is shown.
- [ ] No `innerHTML`, `eval`, `new Function`, or `document.write`. All DOM output goes through React (text nodes / inline style objects).
- [ ] All input is bounded and validated: `localStorage` via the validation layer; keyboard/touch map only to fixed actions; no URL params are consumed.
- [ ] CSP and security headers are served by `GameStack`'s `ResponseHeadersPolicy` (CloudFront). Fonts are self-hosted (no external origins). Revisit the CSP if the build ever emits inline scripts.
- [ ] No domains, URLs, or account values in source — only in `.env` (see `infra/.env.example`, `frontend/.env.example`).
