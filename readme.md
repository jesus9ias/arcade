# arcade

A monorepo of static browser minigames. Each game is fully autonomous — its own frontend, its own AWS infrastructure, and its own subdomain — while sharing a common contract and a CDK construct library (`@arcade/infra`).

- **Frontend:** Astro (SSG) + React + TypeScript (strict), tested with Vitest, internationalized (English / Spanish) with i18next.
- **Infrastructure:** AWS CDK v2 — S3 (private) + CloudFront (OAC) + Route 53, deployed from local.
- **CI/CD:** GitHub Actions builds and deploys each game's frontend on push to `main`.

The full contract and design decisions live in [`spec.md`](spec.md). Working instructions for Claude Code live in [`claude.md`](claude.md).

## Games

| Game | Description | Status |
|---|---|---|
| [gato](gato/spec.md) | Tic-tac-toe (vs machine or local 2-player) | Implemented; deployed |
| [snake](snake/spec.md) | Snake — forest theme, Simple + Versus, endless levels, efficiency scoring | Implemented; deployed |

## Prerequisites

- **Node 24** (see [`.nvmrc`](.nvmrc); `nvm use` if you use nvm)
- **npm** (workspaces; ships with Node)
- **AWS CLI v2** — configured credentials (used by CDK deploys and CI)
- **AWS CDK v2** — invoked per game via `npx`/local devDependency (no global install required)

You also need, already provisioned in your AWS account (this repo does **not** create them):

- A Route 53 hosted zone for your domain
- A wildcard ACM certificate in `us-east-1`

## Setup

Install all workspaces from the repo root:

```bash
npm install
```

This links `@arcade/infra` into each game and generates `package-lock.json` (used by CI's `npm ci`).

## Repository layout

```
infra/        @arcade/infra — shared CDK constructs (library, not deployable)
_template/    scaffold for new games (source of truth; never deployed)
gato/         a game: spec.md + frontend/ + infra/
snake/        a game: spec.md + frontend/ + infra/
.github/workflows/   per-game deploy workflows (path-filtered)
```

## Per-game local development

Run a game's frontend dev server:

```bash
npm run dev --workspace gato/frontend
```

Run a game's tests:

```bash
npm run test --workspace gato/frontend
```

Build a game (output to `<game>/frontend/dist/`):

```bash
npm run build --workspace gato/frontend
```

Type-check the shared infra library:

```bash
npm --prefix infra run typecheck
```

> **Windows PowerShell note:** `&&` is not a valid separator in Windows PowerShell 5.1. Run chained steps as separate commands, or use `;`. Prefer the `--workspace` / `--prefix` forms above, which do not require changing directory.

## Per-game infrastructure deploy (CDK, from local)

Infrastructure is deployed manually from your machine (it changes infrequently and carries more risk than frontend deploys).

1. Create `<game>/infra/.env` from `<game>/infra/.env.example` and fill in every value (subdomain, domain, hosted zone id, certificate ARN, account id, region `us-east-1`).
2. From the game's infra folder:

   ```bash
   cd gato/infra
   npm run diff      # review the planned changes
   npm run deploy    # cdk deploy
   ```

3. Note the stack outputs (`BucketName`, `DistributionId`, `DistributionDomainName`, `SiteUrl`) — the bucket name and distribution id are needed as GitHub secrets for the frontend deploy.

The stack creates a private versioned S3 bucket, a CloudFront distribution (OAC, HTTPS-only, SPA fallback, security headers incl. CSP), and Route 53 A + AAAA records pointing `<subdomain>.<domain>` at the distribution.

## Per-game frontend deploy (GitHub Actions)

Pushing to `main` with changes under `<game>/**` triggers `.github/workflows/deploy-<game>.yml`, which runs: install → test (gate) → build → S3 sync → CloudFront invalidation. The deploy proceeds only if tests pass.

Configure these repository secrets (per game where noted):

| Secret | Scope |
|---|---|
| `AWS_ACCESS_KEY_ID` | shared |
| `AWS_SECRET_ACCESS_KEY` | shared |
| `AWS_REGION` | shared (`us-east-1`) |
| `GATO_BUCKET_NAME`, `GATO_DISTRIBUTION_ID` | gato |
| `SNAKE_BUCKET_NAME`, `SNAKE_DISTRIBUTION_ID` | snake |

Set the frontend's `PUBLIC_SITE_URL` (in `<game>/frontend/.env`) to the deployed URL; no domain is hardcoded anywhere in source.

## Adding a new game

Briefly: confirm a kebab-case name, copy `_template/frontend` and `_template/infra` into `<game>/`, rename the `package.json` `name` fields, register the two workspaces in the root `package.json`, write and get approval for `<game>/spec.md`, add `.github/workflows/deploy-<game>.yml`, then `npm install` and implement in stages. See [`claude.md`](claude.md) → "How to add a new game" for the full checklist.
