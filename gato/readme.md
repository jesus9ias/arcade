# gato

Tic-tac-toe with an informal feel: play against an unbeatable machine (minimax) or against a friend on the same device, with match history, a leaderboard, meme reactions, English/Spanish, and light/dark themes.

Part of the [`arcade`](../readme.md) monorepo. Game contract: [`spec.md`](spec.md). Working instructions: [`claude.md`](claude.md).

## Stack

Astro 5 (SSG) + React 19 + TypeScript (strict), Vitest 3, i18next. Static frontend, no backend. Infrastructure (S3 + CloudFront + Route 53) via `@arcade/infra` — see [`infra/readme.md`](infra/readme.md).

## Setup

Install from the monorepo root (workspaces):

```bash
npm install
```

## Local development

```bash
npm run dev --workspace gato/frontend        # dev server
npm run test --workspace gato/frontend       # unit tests (Vitest)
npm run typecheck --workspace gato/frontend  # astro check (strict types)
npm run build --workspace gato/frontend      # production build → gato/frontend/dist/
```

> Windows PowerShell: `&&` is not valid in PowerShell 5.1 — run chained commands separately or use `;`.

## Meme images

The game shows a random meme on game over. Claude Code created the folder structure and loader; **you provide the images**:

1. Drop image files into `frontend/public/memes/win/`, `frontend/public/memes/lose/`, and `frontend/public/memes/neutral/`.
2. Run `npm run gen:memes --workspace gato/frontend` to regenerate `frontend/src/lib/memes/catalog.json` (it scans the folders above and lists the filenames per category).

Category per outcome: human win (HVM) → `win`; machine win (HVM) → `lose`; draw, or any HVH result → `neutral`. If a category has no images, the game shows a non-blocking notice instead of a meme.

## Configuration

- `frontend/.env` — set `PUBLIC_SITE_URL` (copy from `frontend/.env.example`). No domains are hardcoded in source.
- `infra/.env` — AWS values for deployment (copy from `infra/.env.example`).

## Deployment

- **Infrastructure (from local, manual):** see [`infra/readme.md`](infra/readme.md) — configure `infra/.env`, then `npm run diff` / `npm run deploy` from `gato/infra`.
- **Frontend (automated):** pushing to `main` with changes under `gato/**` triggers `.github/workflows/deploy-gato.yml` (install → test → build → S3 sync → CloudFront invalidation). Requires the repo secrets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `GATO_BUCKET_NAME`, `GATO_DISTRIBUTION_ID`.

## How it works (brief)

- Pure game logic lives in `frontend/src/lib/` (`engine/`, `state/transitions`, `history/`, `memes/`, `validation/`) and is fully unit-tested.
- The `useGato` hook (`lib/state/useGato.ts`) is the only bridge between that logic and React: it owns persistence, the machine's auto-move, match recording, and theme/language.
- Preferences and history persist in `localStorage` (`gato_prefs`, `gato_history`), always parsed through the validation layer.
