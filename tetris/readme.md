# tetris

A classic Tetris built to modern-guideline rules with a neon dark aesthetic. Move, rotate (Super Rotation System with wall kicks), soft-drop, hard-drop and hold tetriminos to clear lines across **15 levels** of increasing speed. Full **T-Spin / Back-to-Back / Combo / Perfect Clear** scoring, a hold slot capped at 10 uses per run, a 5-piece next queue, a ghost piece and a 7-bag randomizer. English/Spanish, sound with a mute toggle, and a local match history (last 50 games, paginated) with an all-time best. Dark-only — no theme toggle.

Part of the [`arcade`](../readme.md) monorepo. Game contract: [`spec.md`](spec.md). Working instructions: [`claude.md`](claude.md). Design reference: [`design/`](design/).

## Stack

Astro 5 (SSG) + React 19 + TypeScript (strict), Vitest 3, i18next. The game engine (board, rotation, randomizer, scoring, progression, T-Spin) is pure and DOM-free; a single controller hook (`useTetris`) drives the render loop, input, audio and persistence. Static frontend, no backend. Infrastructure (S3 + CloudFront + Route 53) via `@arcade/infra` — see [`infra/readme.md`](infra/readme.md).

## Setup

Install from the monorepo root (workspaces):

```bash
npm install
```

## Local development

```bash
npm run dev --workspace tetris/frontend        # dev server
npm run test --workspace tetris/frontend       # unit tests (Vitest)
npm run typecheck --workspace tetris/frontend  # astro check (strict types)
npm run build --workspace tetris/frontend      # production build → tetris/frontend/dist/
```

> Windows PowerShell: `&&` is not valid in PowerShell 5.1 — run chained commands separately or use `;`.

## How to play

Choose a starting level (1–15) on the start screen, then:

| Action | Keyboard | Touch |
|---|---|---|
| Move left / right | `←` / `→` | `◀` / `▶` |
| Soft drop | `↓` | `▼` (hold) |
| Hard drop | `Space` | `⤓` |
| Rotate clockwise | `↑` or `X` | `⟳` |
| Rotate counter-clockwise | `Z` | `⟲` |
| Hold (max 10 / game) | `C` or `Shift` | `HOLD` |
| Pause / resume | `P` or `Esc` | header ❚❚ |
| Restart (after game over / win) | `Enter` | on-screen button |

- **Level progression** is measured in *credited lines*: special actions grant more than their physical line count (a Tetris credits 8, a T-Spin Double 12, etc.). The starting level absorbs the cumulative requirement; finishing level 15 always totals 600 credited lines.
- **Scoring** follows the guideline (line clears × level, T-Spins, Back-to-Back, combos, Perfect Clear). Match history splits points into *regular* vs *bonus*.
- A refresh restarts from the start screen; the in-progress game is **not** saved. Preferences (`tetris_prefs`) and match history (`tetris_scores`) persist in `localStorage`.

## Assets pending

- **Fonts:** drop `orbitron.woff2` and `space-grotesk.woff2` into [`frontend/public/fonts/`](frontend/public/fonts/) (self-hosted per the CSP; the CSS falls back to system fonts until then).
- **Audio:** SFX/music files under `frontend/public/audio/` are placeholders; the audio system and mute toggle work now and play the files once added.

## Deploy

Infrastructure is deployed manually from local — see [`infra/readme.md`](infra/readme.md). The GitHub Actions workflow [`deploy-tetris.yml`](../.github/workflows/deploy-tetris.yml) tests, builds and syncs the frontend to S3 on push to `main` (path-filtered to `tetris/**`), then invalidates CloudFront. It needs the `TETRIS_BUCKET_NAME` and `TETRIS_DISTRIBUTION_ID` secrets from the stack outputs.
