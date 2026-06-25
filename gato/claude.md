# claude.md — gato

Game-specific working instructions for Claude Code. This game inherits the monorepo contract: read the root [`spec.md`](../spec.md), the root [`claude.md`](../claude.md), and this game's [`spec.md`](spec.md) before acting on any prompt. Where documents disagree, the monorepo `spec.md` wins unless a deviation is declared in `gato/spec.md`.

---

## Overview

`gato` is a tic-tac-toe game with an informal, lighthearted feel.

- Two modes: **Human vs Machine** (`HVM`, optimal minimax opponent) and **Human vs Human** (`HVH`, two players on one device).
- The human always moves first and chooses their symbol (X or O) at setup.
- Each finished game is recorded to `localStorage` and a random meme image is shown for the outcome.
- A match-history modal offers a list view and a leaderboard view.
- Bilingual (English / Spanish) via i18next; light/dark theme.
- Static frontend only — **no backend**.

---

## Working style (game-specific notes)

All monorepo rules apply (spec-first, stage discipline, no magic values, English code, i18n-only UI strings, input validation, security). In addition:

- **Tests are the contract and are locked.** The unit tests under `frontend/src/**/__tests__/` were written in Stage 2 and define the public API of the logic layers. Do not add or modify a test without explicit developer authorization; if a feature needs a new test, add its definition to `spec.md` first.
- **Logic before UI.** Game logic lives in pure, DOM-free modules (`engine/`, `state/transitions`, `history/`, `memes/`, `validation/`). Components never contain game rules — they call the logic layer through the `useGato` controller.
- **`useGato` is the only bridge between logic and React.** Side effects (localStorage, the machine's auto-move, recording matches, theme/language application) live there, not in components or in the pure modules.
- **i18n key sets stay identical.** `en.json` and `es.json` must always have the same keys with non-empty values (guarded by `T-I18N-01/02`). Add new keys to both.

---

## Directory map

```
gato/
├── spec.md                 # Game contract — source of truth for gato
├── claude.md               # This file
├── readme.md               # Local dev / test / deploy guide
├── frontend/
│   ├── public/memes/        # win/ lose/ neutral/ — developer-provided images
│   └── src/
│       ├── components/      # React UI only (Board, Cell, modals, toggles, App)
│       ├── i18n/            # en.json, es.json, config.ts (i18next setup)
│       ├── layouts/         # Layout.astro
│       ├── pages/           # index.astro (renders <App client:only="react" />)
│       ├── styles/          # global.css (CSS custom properties, both themes)
│       └── lib/
│           ├── constants/   # game, preferences, storage, ui, validation, memes
│           ├── engine/      # board.ts, minimax.ts (pure)
│           ├── state/       # transitions.ts (pure), useGato.ts (React controller)
│           ├── history/     # history.ts (records + leaderboard)
│           ├── memes/       # memes.ts (category + random pick)
│           └── validation/  # playerName.ts, localStorage.ts, result.ts
└── infra/                   # CDK app (GameStack) — see infra/readme.md
```

Architecture is **layer-based** (the gato spec's declared choice), with two extra domain folders — `history/` and `memes/` — alongside the default `engine/`/`state/`/`validation/`.

---

## How to modify game rules or add a feature

1. **Update `spec.md` first.** Add or change the relevant Gherkin scenario and, if logic is affected, the unit-test definition. Log the decision in the Decisions Log. Get developer authorization (stage discipline still applies).
2. **Adjust/extend tests** (only with authorization) to cover the new behavior.
3. **Implement in the logic layer** (`engine/`, `state/`, `history/`, `memes/`, `validation/`) as pure functions; keep magic values in `lib/constants/`.
4. **Wire it through `useGato`**, then surface it in components.
5. **Add any new UI strings** to both `i18n/en.json` and `i18n/es.json`.
6. **Validate:** `npm run test --workspace gato/frontend`, then `npm run typecheck --workspace gato/frontend`, then `npm run build --workspace gato/frontend`.

If a change contradicts an existing scenario or decision (as the "New game" behavior change on 2026-06-25 did), stop, update the documentation first, then change the code.

---

## Security checklist

- [ ] Player names validated with `validatePlayerName` (trim, length ≤ 30, reject `<`/`>`); the setup/edit forms block submit until valid.
- [ ] `gato_prefs` and `gato_history` parsed through `validatePrefs` / `validateHistory`; invalid prefs reset to defaults, invalid history records are discarded, and a visible warning banner is shown.
- [ ] No `innerHTML`, `eval`, `new Function`, or `document.write`. All DOM output goes through React (text nodes), never raw HTML.
- [ ] Meme `src` is built from a fixed base path plus a catalog filename; user input never reaches it.
- [ ] CSP and security headers are served by `GameStack`'s `ResponseHeadersPolicy` (CloudFront). Revisit the CSP if the build ever emits inline scripts.
- [ ] No domains, URLs, or account values in source — only in `.env` (see `infra/.env.example`, `frontend/.env.example`).
