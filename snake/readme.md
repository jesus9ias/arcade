# snake

A real-time arcade snake with a forest look and feel: eat fruit fast (value decays the longer it waits), clear endless levels that speed up, and dodge walls, obstacles, and yourself. Play **Simple** (you alone) or **Versus** (against a machine snake — first death ends the game and the survivor gets +50%). English/Spanish, light/dark themes, and a paginated game history.

Part of the [`arcade`](../readme.md) monorepo. Game contract: [`spec.md`](spec.md). Working instructions: [`claude.md`](claude.md).

## Stack

Astro 5 (SSG) + React 19 + TypeScript (strict), Vitest 3, i18next. The play field renders on an HTML5 Canvas; the game engine is pure and DOM-free. Static frontend, no backend. Infrastructure (S3 + CloudFront + Route 53) via `@arcade/infra` — see [`infra/readme.md`](infra/readme.md).

## Setup

Install from the monorepo root (workspaces):

```bash
npm install
```

## Local development

```bash
npm run dev --workspace snake/frontend        # dev server
npm run test --workspace snake/frontend       # unit tests (Vitest)
npm run typecheck --workspace snake/frontend  # astro check (strict types)
npm run build --workspace snake/frontend      # production build → snake/frontend/dist/
```

> Windows PowerShell: `&&` is not valid in PowerShell 5.1 — run chained commands separately or use `;`.

## How to play

- **Turn:** `→` / tap the right half of the board = clockwise; `←` / tap the left half = counter-clockwise. (Controls are relative — the snake rotates, it does not jump to a direction.)
- **Pause / resume:** `p`.
- **Boost:** `a` toggles a faster speed — you reach fruit before it decays as much, but with more risk. Boost gives no point bonus on its own.
- **Goal:** eat the required regular fruits to clear each level. Eating three regular fruits in a row above 60% of their value drops a non-decaying **golden** bonus fruit.
- **Versus:** the machine plays its own snake (efficiency-only AI). Snakes can't collide; when either dies the game ends and the survivor's score is multiplied by 1.5. No hard win/lose — the history shows who scored more.

A refresh restarts from level 1; in-progress games are not saved. Preferences and history persist in `localStorage`.

## Configuration

- `frontend/.env` — set `PUBLIC_SITE_URL` (copy from `frontend/.env.example`). No domains are hardcoded in source.
- `infra/.env` — AWS values for deployment (copy from `infra/.env.example`).

## Deployment

- **Infrastructure (from local, manual):** see [`infra/readme.md`](infra/readme.md) — configure `infra/.env`, then `npm run diff` / `npm run deploy` from `snake/infra`.
- **Frontend (automated):** pushing to `main` with changes under `snake/**` triggers `.github/workflows/deploy-snake.yml` (install → test → build → S3 sync → CloudFront invalidation). Requires the repo secrets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `SNAKE_BUCKET_NAME`, `SNAKE_DISTRIBUTION_ID`.

## How it works (brief)

- Pure game logic lives in `frontend/src/lib/` (`engine/`, `scoring/`, `level/`, `ai/`, `state/transitions`, `history/`, `validation/`) and is fully unit-tested. The engine advances one **tick** at a time and is deterministic — fruit decay is measured in ticks, not wall-clock time.
- The `useSnake` hook (`lib/state/useSnake.ts`) is the only bridge between that logic and React: it owns the real-time loop, keyboard/touch input, the machine's moves, persistence, and recording finished games.
- The machine AI (`lib/ai/ai.ts`) uses breadth-first search to the nearest reachable fruit, with a flood-fill survival fallback. See the spec's Decisions Log for why BFS over Dijkstra/A*.
- Preferences and history persist in `localStorage` (`snake_prefs`, `snake_history`), always parsed through the validation layer.
