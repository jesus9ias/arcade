# claude.md — arcade monorepo

Working instructions for Claude Code in this repository. The authoritative contract is [`spec.md`](spec.md); read it fully before acting on any prompt. This file summarizes how to work day to day. Where this file and `spec.md` disagree, `spec.md` wins.

---

## Monorepo overview

`arcade` is an npm-workspaces monorepo (Node 24) of static browser minigames. Each game is fully autonomous: its own frontend, its own infrastructure, and its own subdomain. Games share a CDK construct library, `@arcade/infra`, and a common contract.

- **Frontend:** Astro 5 (SSG) + React 19 + TypeScript (strict) + Vite 6, tested with Vitest 3, internationalized with i18next + react-i18next.
- **Infra:** AWS CDK v2 (TypeScript). Hosting is S3 (private) + CloudFront (OAC) + Route 53, deployed from local.
- **CI/CD:** GitHub Actions builds and deploys each game's frontend on push to `main`.

Workspaces (root `package.json`): `infra`, `gato/frontend`, `gato/infra`, `snake/frontend`, `snake/infra`. `_template/` is **not** a workspace — it is the scaffold source of truth and is never installed or deployed.

---

## Working style (the rules)

These are enforced on every change. The full statements live in [`spec.md`](spec.md) under "Working Style for Claude Code".

- **Spec-first.** Every implemented feature traces to a Gherkin scenario in the monorepo `spec.md` or the game's `spec.md`. Nothing is built speculatively.
- **Stage discipline.** Work proceeds in ordered stages. Begin at Stage 1; never advance to the next stage without explicit developer authorization.
- **TDD gate.** Tests are written before implementation. Code is added only to make a defined test pass. Never create or modify tests without authorization. Orphaned tests are flagged before removal.
- **Conflict detection.** If a change would contradict existing docs or decisions, stop and alert the developer. If confirmed, update the documentation first, then change the code.
- **No magic values.** All constants and enums live in dedicated files (`src/lib/constants/` for games, `infra/src/constants/` for the library). No inline literals.
- **Language.** All code, comments, identifiers, and docs are English. User-visible strings live only in `src/i18n/en.json` / `es.json`; never hardcoded in components or pages.
- **Sensitive data.** Domains, subdomains, URLs, account ids, hosted zone ids, and certificate ARNs live only in `.env` files. Never in source or docs. Verify on every edit.
- **Scope discipline.** Unrelated code is not modified without authorization.
- **Separation of concerns.** Game logic, state, and UI are distinct layers. Reusable logic is extracted to shared utilities.
- **Security.** Validate all input. No `innerHTML`, `eval`, `new Function`, or `document.write`. DOM updates via `textContent` or controlled `createElement`.
- **Documentation sync.** `claude.md`, `readme.md`, and the applicable `spec.md` are updated after every change that affects structure, decisions, or rules. New decisions are logged immediately in the relevant Decisions Log.
- **Template inheritance.** New games are scaffolded from `_template/`. Any deviation is documented in the game's `spec.md` (Deviations section) and confirmed before implementation.

---

## Directory map

```
arcade/
├── package.json        # npm workspaces root (Node 24)
├── .nvmrc              # 24
├── spec.md             # Monorepo contract — source of truth
├── claude.md           # This file
├── readme.md           # Developer setup & deployment guide
│
├── infra/              # @arcade/infra — shared CDK construct library (NOT deployable)
│   └── src/
│       ├── constants/  # All infra literals (CSP, TTLs, HTTP codes, root object)
│       ├── constructs/ # GameStack (implemented), GameBackendStack (placeholder)
│       └── index.ts    # Public exports
│
├── _template/          # Scaffold for new games (source of truth; never deployed)
│   ├── spec.md         # Game spec template — fill before coding a new game
│   ├── frontend/       # Astro + React + Vite + Vitest scaffold
│   └── infra/          # CDK app scaffold consuming @arcade/infra
│
├── gato/               # Game: tic-tac-toe
│   ├── spec.md  frontend/  infra/
├── snake/              # Game: snake (spec pending)
│   ├── spec.md  frontend/  infra/
│
└── .github/workflows/  # deploy-gato.yml, deploy-snake.yml (path-filtered per game)
```

Each game's `frontend/src/` is layer-based by default:

```
src/
├── components/   # React UI components (no game logic)
├── i18n/         # en.json / es.json (identical key sets, non-empty values)
├── lib/
│   ├── constants/   # Enums and constants (no magic values elsewhere)
│   ├── engine/      # Pure game logic — no DOM
│   ├── state/       # State management — separate from rendering
│   └── validation/  # Input / localStorage schema validation
├── layouts/      # Astro layouts
├── pages/        # Astro pages
└── styles/       # CSS custom properties (theming)
```

A game may use a **feature-based** architecture instead when complexity justifies it; the choice is declared in the game's `spec.md` before Stage 1.

---

## How to add a new game

Before writing any code, follow this checklist (full version in `spec.md` → "Adding a New Game"):

1. **Confirm the game name** — kebab-case. It becomes the folder name and the subdomain prefix.
2. **Scaffold from `_template/`** — copy `_template/frontend/` and `_template/infra/` into `<game>/`, and rename the `name` field in both `package.json` files to `@arcade/<game>-frontend` and `@arcade/<game>-infra`.
3. **Register workspaces** — add `<game>/frontend` and `<game>/infra` to `workspaces` in the root `package.json`.
4. **Write `<game>/spec.md`** — fill the template completely (rules, win/lose/draw, controls, states, data model, architecture choice, i18n keys, Gherkin scenarios, unit test definitions, backend need, deviations, stages, decisions log). **The spec must be approved by the developer before Stage 1 of the game begins.**
5. **Set the stack id** — in `<game>/infra/bin/app.ts`, set `STACK_ID` to `<Game>Stack`.
6. **Add the workflow** — create `.github/workflows/deploy-<game>.yml` with a `<game>/**` path filter; copy an existing one and rename the per-game secrets (`<GAME>_BUCKET_NAME`, `<GAME>_DISTRIBUTION_ID`).
7. **Populate `.env.example`** — both `<game>/frontend/.env.example` and `<game>/infra/.env.example` (already present from the template; confirm values).
8. **Run `npm install`** at the root to link the new workspaces.
9. **Implement in stages** — per the game's `spec.md`. No stage is skipped; stop for authorization between stages.

After adding a game, keep `_template/` in sync if the scaffold itself changed (it is the single source of truth — drift shows up as a diff).

---

## How to update `@arcade/infra`

The library exports CDK constructs consumed by each game's `infra/bin/app.ts`. It is consumed as TypeScript source (`main`/`types` → `src/index.ts`); there is no build step.

- Put new tunable values in `infra/src/constants/` — never inline literals in a construct.
- Implement constructs in `infra/src/constructs/` and export them from `infra/src/index.ts`.
- `GameBackendStack` is a documented placeholder (interface only). Implement it in its existing file when the first backend game is specified, then export the class from `index.ts`.
- **Validate:** `npm --prefix infra run typecheck` (runs `tsc --noEmit`). It must pass with no errors. Avoid `cd infra && npx tsc --noEmit`: `&&` is not valid in Windows PowerShell 5.1, and mixing `-p`/`--project` with file arguments triggers `error TS5042`.
- A change to a construct affects every game. Review each game's `infra/bin/app.ts` and run `cdk diff` per game before deploying.

---

## Security checklist

Apply to every game (full statement in `spec.md` → "Security Contract"):

- [ ] All user input (form fields, URL params, localStorage) validated against a strict schema before use.
- [ ] No `innerHTML`, `eval`, `new Function`, or `document.write`. DOM updates via `textContent` or controlled `createElement`.
- [ ] localStorage parsed through the validation layer; on schema mismatch, reset to default and show a visible warning.
- [ ] URL parameters matched against known values; unknown values render a safe error state, never reflected unescaped into the DOM.
- [ ] CloudFront serves a Content Security Policy and security headers (handled centrally by `GameStack`'s `ResponseHeadersPolicy`; revisit the CSP per game if the build emits inline scripts).
- [ ] No sensitive values in source or docs — all in `.env`.

---

## Environment variable reference

Never hardcode any of these; they live only in `.env` files (`.env` is git-ignored; `.env.example` documents the keys).

### `<game>/infra/.env`

| Variable | Purpose |
|---|---|
| `SUBDOMAIN` | Game subdomain prefix, e.g. `snake` |
| `DOMAIN_NAME` | Parent domain that owns the hosted zone |
| `HOSTED_ZONE_ID` | Id of the existing Route 53 hosted zone |
| `CERTIFICATE_ARN` | ARN of the existing wildcard ACM certificate (us-east-1) |
| `AWS_ACCOUNT_ID` | Target AWS account id |
| `AWS_REGION` | Must be `us-east-1` (ACM + CloudFront) |
| `AWS_PROFILE` | Optional named credentials profile |

### `<game>/frontend/.env`

| Variable | Purpose |
|---|---|
| `PUBLIC_SITE_URL` | Full URL of the deployed game, e.g. `https://<subdomain>.<domain>` |

### GitHub Actions secrets (per game)

`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `<GAME>_BUCKET_NAME`, `<GAME>_DISTRIBUTION_ID`.

---

## Validation commands quick reference

| What | Command |
|---|---|
| Install everything | `npm install` (at repo root) |
| Type-check the infra library | `npm --prefix infra run typecheck` |
| Run a game's tests | `npm run test --workspace <game>/frontend` |
| Build a game | `npm run build --workspace <game>/frontend` |
| Deploy a game's infra (from local) | `cd <game>/infra` then `npm run deploy` |
