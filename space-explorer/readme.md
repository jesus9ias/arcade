# space-explorer

A physics-based planetary mission game. Pilot a rover down through a planet's atmosphere against gravity and a limited fuel supply, touch down gently on flat landing zones to collect mineral samples, then fire upward off the top of the scene to escape. Three planets (Verdania, Ferrum, Glacius), unlocked in order, each with its own gravity, fuel budget and terrain. English/Spanish, light/dark themes, best-time tracking per level.

Part of the [`arcade`](../readme.md) monorepo. Game contract: [`spec.md`](spec.md). Working instructions: [`claude.md`](claude.md).

## Stack

Astro 5 (SSG) + React 19 + TypeScript (strict), Vitest 3, i18next. The mission scene renders on an HTML5 Canvas; the physics/terrain/mission engine is pure and DOM-free. Static frontend, no backend. Infrastructure (S3 + CloudFront + Route 53) via `@arcade/infra` — see [`infra/readme.md`](infra/readme.md).

## Setup

Install from the monorepo root (workspaces):

```bash
npm install
```

## Local development

```bash
npm run dev --workspace space-explorer/frontend        # dev server
npm run test --workspace space-explorer/frontend       # unit tests (Vitest)
npm run typecheck --workspace space-explorer/frontend  # astro check (strict types)
npm run build --workspace space-explorer/frontend      # production build → space-explorer/frontend/dist/
```

> Windows PowerShell: `&&` is not valid in PowerShell 5.1 — run chained commands separately or use `;`.

## How to play

- **Thrusters:** `←` left thruster (pushes the rover **right**), `→` right thruster (pushes **left**), `↑` main thruster (ascend / brake your fall). Hold several at once. Thrusters only work in the atmosphere and burn fuel whenever active.
- **Land:** descend onto a flat zone at low speed — gentle enough vertically *and* laterally, with the rover centered on the zone. Landing on a sample's zone collects it automatically. Any other contact (too fast, sloped ground, a zone narrower than the rover) destroys the rover.
- **Escape:** once **all** samples are collected, fly off the top edge to complete the level. Leaving the top with samples still missing **aborts** the mission back to the level select (no progress saved).
- **Pause:** `Escape` (Restart / Continue / Exit). **Controls help:** `c`. On touch devices, on-screen arrow buttons mirror the keyboard.
- **Goal:** beat your best time per level. Best time updates only on a successful escape and only when you go faster — failures and aborts never affect it.

A refresh restarts from the level select; in-progress missions are not saved. Preferences and level progress persist in `localStorage` (`space_prefs`, `space_progress`).

> Phase 1 ships propulsor flight only. Water turbines (and Glacius's underwater sample), the laser/subsurface samples, and additional planets are Phase 2.

## Configuration

- `frontend/.env` — set `PUBLIC_SITE_URL` (copy from `frontend/.env.example`). No domains are hardcoded in source.
- `infra/.env` — AWS values for deployment (copy from `infra/.env.example`).

## Deployment

- **Infrastructure (from local, manual):** see [`infra/readme.md`](infra/readme.md) — configure `infra/.env`, then `npm run diff` / `npm run deploy` from `space-explorer/infra`.
- **Frontend (automated):** pushing to `main` with changes under `space-explorer/**` triggers `.github/workflows/deploy-space-explorer.yml` (install → test → build → S3 sync → CloudFront invalidation). Requires the repo secrets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `SPACE_EXPLORER_BUCKET_NAME`, `SPACE_EXPLORER_DISTRIBUTION_ID`.

## How it works (brief)

- Pure game logic lives in `frontend/src/lib/` (`physics/`, `terrain/`, `mission/`, `progress/`, `state/transitions`, `validation/`) and is fully unit-tested. Every function takes its inputs (including `dt` in seconds) and returns a new value — no clock, no DOM, no randomness.
- The `useRover` controller (`lib/state/useRover.ts`, exported as `useGame`) is the only bridge to React: it owns the `requestAnimationFrame` loop, keyboard/touch input, the stuck-underwater timeout, and persistence of progress and best times.
- Levels are data (`lib/levels/`): a `LevelConfig` per planet with a heightmap, water zones, samples and a theme. Adding a planet is a new config object — no engine changes.
- Coordinates: rover positions are from the top of the scene, terrain/water heights from the bottom; a fixed `SCENE_HEIGHT` reconciles them. The camera pans horizontally only and is static when the scene fits the viewport.
- Preferences and progress persist in `localStorage`, always parsed through the validation layer; tampered data resets safely with a visible warning.
