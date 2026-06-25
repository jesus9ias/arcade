# claude.md — snake

Game-specific working instructions for Claude Code. This game inherits the monorepo contract: read the root [`spec.md`](../spec.md), the root [`claude.md`](../claude.md), and this game's [`spec.md`](spec.md) before acting on any prompt. Where documents disagree, the monorepo `spec.md` wins unless a deviation is declared in `snake/spec.md`.

---

## Overview

`snake` is a real-time arcade snake game with a **forest** look and feel.

- Steer a snake on a fixed 25×25 grid, eating fruit to score and advance endless levels. Each level is faster; each fruit is worth the most the instant it appears and decays to a 10% floor — it is a game of **efficiency**, not survival.
- Death on hitting a wall, an obstacle (8 fixed, placed once per game), or yourself.
- Two modes: **Simple** (player only) and **Versus** (player + a machine snake; first death ends the game and the survivor gets +50%). **Remote** is a reserved enum/state placeholder only — not implemented, no networking, no backend.
- Relative-turn controls: `←`/`→` rotate CCW/CW (or tap the left/right half of the board), `p` pause, `a` boost (toggle).
- Efficiency bonus: 3 consecutive regular fruits eaten above 60% value spawn a non-decaying golden fruit.
- Bilingual (English / Spanish) via i18next; light/dark theme; history (Simple/Versus tabs, paginated, clearable) and a "How to play" modal.
- Static frontend only — **no backend**.

---

## Working style (game-specific notes)

All monorepo rules apply (spec-first, stage discipline, no magic values, English code, i18n-only UI strings, input validation, security). In addition:

- **Tests are the contract and are locked.** The unit tests under `frontend/src/**/__tests__/` were written in Stage 2 and define the public API of the logic layers (`T-DIR`, `T-ENG`, `T-OBST`, `T-VS`, `T-SCORE`, `T-EFF`, `T-LVL`, `T-AI`, `T-ST`, `T-HIST`, `T-LS`, `T-I18N`). Do not add or modify a test without explicit developer authorization; if a feature needs a new test, add its definition to `spec.md` first.
- **The engine is pure and deterministic.** `advanceTick(state)` produces the next state from the current one — no DOM, no clock, no randomness beyond an injectable `rng` (used only for fruit/obstacle placement). Time-based mechanics (fruit decay) are measured in **ticks**, never wall-clock time, so the engine stays testable. Keep it that way.
- **`useSnake` is the only bridge between logic and React.** The real-time loop (`setInterval` keyed on `speedMs`), keyboard/touch input, the machine's per-tick move, localStorage, and recording finished games all live there — not in components or the pure modules.
- **Game logic never lives in components.** Components render state and call the controller. The canvas renderer (`GameCanvas`) and fruit sprites are presentation; they read state, they don't compute rules.
- **i18n key sets stay identical.** `en.json` and `es.json` must always have the same keys with non-empty values (guarded by `T-I18N-01/02`). Add new keys to both.

---

## Directory map

```
snake/
├── spec.md                 # Game contract — source of truth for snake
├── claude.md               # This file
├── readme.md               # Local dev / test / deploy guide
├── frontend/
│   └── src/
│       ├── components/      # React UI only: App, GameCanvas, fruitSprites,
│       │                    #   Hud, Controls, ModeSelector, HelpModal,
│       │                    #   HistoryModal, Modal, ThemeToggle, LanguageToggle
│       ├── i18n/            # en.json, es.json, config.ts (i18next setup)
│       ├── layouts/         # Layout.astro
│       ├── pages/           # index.astro (renders <App client:only="react" />)
│       ├── styles/          # global.css (forest palette, both themes)
│       └── lib/
│           ├── constants/   # game, level, scoring, preferences, storage,
│           │                #   validation, ui — all literals live here
│           ├── engine/      # direction.ts, obstacles.ts, engine.ts (pure)
│           ├── scoring/     # scoring.ts (decay/points), efficiency.ts (streak)
│           ├── level/       # level.ts (fruitsRequired, speedForLevel)
│           ├── ai/          # ai.ts (BFS to nearest fruit + flood-fill fallback)
│           ├── state/       # transitions.ts (pure FSM), useSnake.ts (controller)
│           ├── history/     # history.ts (records + groupByMode)
│           └── validation/  # localStorage.ts, result.ts
└── infra/                   # CDK app (GameStack) — see infra/readme.md
```

Architecture is **layer-based** (the snake spec's declared choice), extended with the domain folders `scoring/`, `level/`, `ai/`, and `history/` alongside the default `engine/`/`state/`/`validation/`.

---

## How to modify game rules or add a feature

1. **Update `spec.md` first.** Add or change the relevant Gherkin scenario and, if logic is affected, the unit-test definition. Log the decision in the Decisions Log. Get developer authorization (stage discipline still applies).
2. **Adjust/extend tests** (only with authorization) to cover the new behavior.
3. **Implement in the logic layer** (`engine/`, `scoring/`, `level/`, `ai/`, `state/transitions`, `history/`, `validation/`) as pure functions; keep every literal in `lib/constants/`.
4. **Wire it through `useSnake`**, then surface it in components.
5. **Add any new UI strings** to both `i18n/en.json` and `i18n/es.json`.
6. **Validate:** `npm run test --workspace snake/frontend`, then `npm run typecheck --workspace snake/frontend`, then `npm run build --workspace snake/frontend`.

If a change contradicts an existing scenario or decision, stop, update the documentation first, then change the code.

### Key invariants to preserve

- The engine stays pure and tick-based (no `Date`, no DOM). Decay is in ticks.
- Golden (bonus) fruit: scores points, but never counts toward the level requirement and never affects the efficiency streak.
- In Versus, only the **player's** regular fruits drive level progression and the streak; the machine's eating only scores.
- Relative turning applies at most one turn per tick (no instant 180° reversal).
- The in-progress game is never persisted; only `snake_prefs` and `snake_history` are.

---

## Security checklist

- [ ] `snake_prefs` and `snake_history` parsed through `validatePrefs` / `validateHistory`; invalid prefs reset to defaults, invalid history records are discarded individually, and a visible warning banner is shown.
- [ ] No `innerHTML`, `eval`, `new Function`, or `document.write`. All DOM output goes through React (text nodes) or the canvas 2D API; fruit sprites are generated from fixed inline SVG markup, never from user input.
- [ ] All input is bounded and validated: localStorage via the validation layer; keyboard/touch map only to fixed actions; URL params are not consumed.
- [ ] CSP and security headers are served by `GameStack`'s `ResponseHeadersPolicy` (CloudFront). Revisit the CSP if the build ever emits inline scripts.
- [ ] No domains, URLs, or account values in source — only in `.env` (see `infra/.env.example`, `frontend/.env.example`).
