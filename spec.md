# arcade — Monorepo Spec

> This document is the source of truth for the arcade monorepo. It defines the contract every game must respect, the shared infrastructure library, and the working discipline for Claude Code. Read it fully before acting on any prompt.

---

## Working Style for Claude Code

- **Spec-first:** Every feature implemented must trace back to a Gherkin scenario defined in either this document or the game-specific `spec.md`. No feature is implemented speculatively.
- **Stage discipline:** Implementation is divided into ordered stages. Begin with Stage 1. Do not proceed to the next stage without explicit developer authorization.
- **Gherkin coverage:** All code created or modified must satisfy the scenarios defined in the applicable spec. Any new decision or feature discovered during implementation must be documented in the relevant `spec.md` immediately before code is written.
- **TDD gate:** Tests are written before implementation. No code is added that does not pass its corresponding test. Tests are never created or modified without developer authorization. Orphaned tests trigger an alert before removal.
- **Conflict detection:** If a proposed code change contradicts existing documentation or decisions, stop, alert the developer, and wait for confirmation. If confirmed, update the documentation first, then apply the change.
- **No magic values:** All constants and enumerations are declared in dedicated constants or enum files. No inline literal values anywhere.
- **Language:** All code, comments, variable names, and documentation (`spec.md`, `claude.md`, `readme.md`) are written in English. User-visible text lives only in JSON: UI strings in `src/i18n/en.json` / `es.json`. No hardcoded UI strings in components or pages.
- **Sensitive data:** All sensitive configuration (domain names, AWS account ID, hosted zone ID, certificate ARN) lives in `.env` files only. Never hardcoded in source. Verify on every edit.
- **Scope discipline:** Code unrelated to the current task is never modified without developer authorization.
- **State / logic / UI separation:** Game logic, state management, and UI rendering are kept in distinct layers. Reusable logic is extracted to shared utilities.
- **Security:** All user input is validated before use. No `innerHTML`, `eval`, `new Function`, or `document.write`. DOM updates use `textContent` or controlled `createElement` calls.
- **Documentation sync:** `claude.md`, `readme.md`, and the applicable `spec.md` are updated after every change that affects structure, decisions, or working rules.
- **Template inheritance:** Every new game is scaffolded from `_template/`. Any deviation from the template contract must be documented in the game's own `spec.md` under a dedicated Deviations section and confirmed with the developer before implementation.

---

## Repository Structure

```
arcade/
├── package.json                  # npm workspaces root (Node 24)
├── .nvmrc                        # 24
├── .gitignore
├── spec.md                       # This document — monorepo contract
├── claude.md                     # Claude Code working instructions
├── readme.md                     # Developer setup and deployment guide
│
├── infra/                        # @arcade/infra — shared CDK construct library
│   ├── package.json              # name: "@arcade/infra", private: true
│   ├── tsconfig.json
│   └── src/
│       ├── constructs/
│       │   ├── GameStack.ts      # S3 + CloudFront + Route53 record
│       │   └── GameBackendStack.ts  # Optional: API Gateway + Lambda wiring
│       └── index.ts              # Public exports
│
├── _template/                    # Scaffold for new games — never deployed
│   ├── spec.md                   # Game spec template (fill before coding)
│   ├── frontend/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── astro.config.ts
│   │   ├── vite.config.ts
│   │   ├── vitest.config.ts
│   │   ├── .env.example
│   │   └── src/
│   │       ├── components/
│   │       ├── i18n/
│   │       │   ├── en.json
│   │       │   └── es.json
│   │       ├── lib/
│   │       │   ├── constants/
│   │       │   ├── engine/       # Game logic — pure functions, no DOM
│   │       │   ├── state/        # State management
│   │       │   └── validation/
│   │       ├── layouts/
│   │       ├── pages/
│   │       └── styles/
│   └── infra/
│       ├── package.json          # imports @arcade/infra
│       ├── tsconfig.json
│       ├── cdk.json
│       ├── .env.example
│       └── bin/
│           └── app.ts            # new GameStack(app, '...Stack', { ... })
│
├── gato/
│   ├── spec.md                   # Game-specific spec (inherits this contract)
│   ├── frontend/                 # Same structure as _template/frontend/
│   └── infra/                    # Same structure as _template/infra/
│
├── snake/
│   ├── spec.md
│   ├── frontend/
│   └── infra/
│
└── .github/
    └── workflows/
        ├── deploy-gato.yml       # path filter: gato/**
        └── deploy-snake.yml      # path filter: snake/**
```

### Notes on structure

- `infra/` at the root is a **library**, not a deployable app. It exports CDK constructs; it never runs `cdk deploy` on its own.
- Each game's `infra/` folder **is** deployable and is run from local by the developer.
- GitHub Actions workflows live at the **repo root** under `.github/workflows/`. GitHub does not recognize workflows in subdirectory `.github/` folders.
- `_template/` is committed to the repo and kept up to date. It is the single source of truth for the structure every game must follow.
- No domain names, subdomains, or URLs are hardcoded anywhere in source code or documentation. All environment-specific values live exclusively in `.env` files.

---

## Tech Stack

### All games — frontend

| Concern | Technology |
|---|---|
| Meta-framework | Astro (latest) — SSG |
| UI framework | React (latest) |
| Language | TypeScript (strict) |
| Bundler | Vite (latest, via Astro) |
| Testing | Vitest (latest) |
| i18n | i18next + react-i18next |
| Styling | CSS custom properties, no CSS framework |
| Node | 24 |

### Frontend architecture

The default frontend structure is **layer-based**: `engine/`, `state/`, `validation/`, `components/`. This works well for simple games with a small surface area.

For games with greater complexity (multiple screens, multiple entity types, distinct subsystems), a **feature-based architecture** is preferred: code is organized by game feature or subsystem rather than by technical layer. The choice is made per game and documented in the game's `spec.md` before Stage 1 begins. Once chosen, the architecture is not changed mid-implementation without developer authorization.

### All games — infra

| Concern | Technology |
|---|---|
| IaC | AWS CDK v2, TypeScript |
| Hosting | S3 (private) + CloudFront (OAC) |
| DNS | Route 53 — subdomain added to existing hosted zone |
| TLS | Existing wildcard ACM certificate (passed via `.env`) |
| Deploy | From local — `cdk deploy` |
| CI/CD | GitHub Actions — build → S3 sync → CloudFront invalidation |

### Optional — games with backend

| Concern | Technology |
|---|---|
| API | API Gateway (HTTP API) |
| Compute | Lambda (Node 24) |
| Database | DynamoDB (single-table) |
| IaC | `GameBackendStack` from `@arcade/infra` |

---

## @arcade/infra — Construct Library

### GameStack

Creates all infrastructure needed to host a static frontend game under its own subdomain.

**What it creates:**
- S3 bucket (private, versioning enabled, no public access)
- CloudFront distribution (OAC, HTTPS-only, default root `index.html`, SPA 404 → 200 redirect)
- Route 53 A + AAAA alias records pointing `<subdomain>.<domainName>` to the CloudFront distribution

**What it does NOT create:**
- The hosted zone (already exists)
- The ACM certificate (already exists, passed as a prop)

**Props:**

```typescript
interface GameStackProps extends StackProps {
  subdomain: string;        // e.g. "snake"
  domainName: string;       // e.g. "game.mydomain.com"
  hostedZoneId: string;     // ID of the existing hosted zone
  certificateArn: string;   // ARN of the existing wildcard certificate
}
```

**Usage in a game's `infra/bin/app.ts`:**

```typescript
import { GameStack } from '@arcade/infra';

new GameStack(app, 'SnakeStack', {
  subdomain: process.env.SUBDOMAIN!,
  domainName: process.env.DOMAIN_NAME!,
  hostedZoneId: process.env.HOSTED_ZONE_ID!,
  certificateArn: process.env.CERTIFICATE_ARN!,
  env: {
    account: process.env.AWS_ACCOUNT_ID!,
    region: process.env.AWS_REGION!,
  },
});
```

### GameBackendStack

Optional construct. Extends a game's CloudFront distribution with an API Gateway origin and Lambda functions. Used only when a game requires backend logic (e.g. leaderboards, persistent state).

Not implemented until the first game that needs it. The file exists in `src/constructs/` as a placeholder with its intended interface documented.

---

## Environment Variables

### Each game — `infra/.env`

```
SUBDOMAIN=              # Game subdomain prefix, e.g. snake
DOMAIN_NAME=            # Apex or parent domain from your DNS setup
HOSTED_ZONE_ID=         # ID of existing Route 53 hosted zone
CERTIFICATE_ARN=        # ARN of existing wildcard ACM certificate
AWS_ACCOUNT_ID=
AWS_REGION=             # us-east-1 (required for ACM + CloudFront)
AWS_PROFILE=            # Optional: named AWS credentials profile
```

### Each game — `frontend/.env`

```
PUBLIC_SITE_URL=        # Full URL of the deployed game, e.g. https://<subdomain>.<yourdomain.com>
```

No domain, subdomain, account ID, or any environment-specific value is hardcoded anywhere in source code or documentation.

---

## Game Contract

Every game in the monorepo must fulfill this contract. Deviations require explicit documentation and developer confirmation.

### Mandatory directory structure

```
<game>/
├── spec.md             # Required — must exist before any code is written
├── frontend/           # Required — always present
└── infra/              # Required — always present
```

A `backend/` folder is allowed when a game requires server-side logic. Its presence must be documented in the game's `spec.md`.

### Mandatory frontend conventions

- Uses the tech stack defined in this document (Astro + React + Vite + Vitest + i18next, Node 24)
- All user-visible strings managed via i18next; translation files at `src/i18n/en.json` and `src/i18n/es.json`; both files always in sync
- No hardcoded UI strings in components or pages
- No magic values; all constants in `src/lib/constants/`
- Default architecture is layer-based (`engine/`, `state/`, `validation/`); feature-based architecture used when game complexity justifies it, declared in the game's `spec.md` before Stage 1
- Game logic in `src/lib/engine/` (or equivalent feature folder) as pure functions with no DOM dependencies
- State management separate from rendering
- All input validated before use
- Tests written before implementation (TDD)
- Gherkin scenarios defined in `spec.md` before any feature is coded
- Build output to `dist/`

### Mandatory infra conventions

- Uses `GameStack` from `@arcade/infra`
- All config via `.env` — no hardcoded values
- One subdomain per game
- Deploy from local with `cdk deploy`

### Mandatory CI/CD

- GitHub Actions workflow at `.github/workflows/deploy-<game>.yml`
- Triggered on push to `main` with path filter `<game>/**`
- Steps: install → test → build → S3 sync → CloudFront invalidation
- AWS credentials via GitHub Actions secrets
- All tests must pass before deploy proceeds

### Mandatory documentation

- `spec.md` exists and is complete before Stage 1 of implementation
- `claude.md` exists at game level with game-specific working instructions
- `readme.md` exists with local dev setup, test, and deploy instructions
- All three files updated after every change that affects them

---

## i18n Contract

Every game supports English and Spanish via **i18next + react-i18next**.

- Translation files live at `src/i18n/en.json` and `src/i18n/es.json`
- Both files must have **identical key sets** at all times
- All values must be non-empty strings
- i18next is configured to return the key itself as a fallback for missing keys (never throws)
- Language preference is stored in `localStorage` under a key namespaced to the game (e.g. `snake_prefs`)
- Default language is detected from `navigator.language`; falls back to English
- No user-visible string is hardcoded in components or pages; all strings are sourced from i18next

---

## Security Contract

All games must comply:

- All user input (fields, URL params, localStorage) validated against strict schemas before use
- No `innerHTML`, `eval`, `new Function`, or `document.write`
- DOM updates via `textContent` or controlled `createElement`
- localStorage values parsed through a validation layer; schema mismatch resets to default and shows a visible warning
- URL parameters matched against known values; unknown values render a safe error state, never reflected unescaped into the DOM
- CloudFront distributions include Content Security Policy headers
- No sensitive values in source code; all in `.env`

---

## Adding a New Game

When receiving a prompt such as "I want to create a new game of type X", follow this checklist before writing any code:

1. **Confirm the game name** — kebab-case, becomes the folder name and subdomain prefix
2. **Scaffold from `_template/`** — copy the full template structure into `<game>/`
3. **Write `<game>/spec.md`** — fill the game spec template completely; this document must be approved by the developer before Stage 1 begins. The spec must include:
   - Game description and rules
   - Win / lose / draw conditions
   - Controls (keyboard, touch, or both)
   - Game states (idle, playing, paused, game over, etc.)
   - Data model (board, score, entities, timers, etc.)
   - i18n keys required
   - Gherkin scenarios covering all game states, transitions, and edge cases
   - Unit test definitions (TDD — written before implementation)
   - Whether a backend is needed and why
   - Deviations from the monorepo contract (if any)
   - Implementation stages
   - Decisions log (starts empty)
4. **Register the workflow** — add `.github/workflows/deploy-<game>.yml`
5. **Add the subdomain** — document it in the game's `infra/.env.example`
6. **Implement in stages** — follow the stage discipline; no stage is skipped

---

## Implementation Stages — Monorepo Bootstrap

These stages apply only to the initial setup of the monorepo and the `@arcade/infra` library. Each game has its own stages defined in its `spec.md`.

---

### Stage 1 — Repository scaffold

**Scope:** Create the monorepo skeleton. No game code, no CDK deployment.

**Deliverables:**

- `package.json` at root with `workspaces: ["infra", "gato/frontend", "gato/infra", "snake/frontend", "snake/infra"]` and Node 24 engine field
- `.nvmrc` with `24`
- `.gitignore` covering `node_modules`, `dist`, `cdk.out`, `.env`, `*.js` (CDK output), `*.d.ts`
- Root `readme.md` (stub — complete in Stage 4)
- Root `claude.md` (stub — complete in Stage 4)
- `infra/` folder with `package.json` (`name: "@arcade/infra"`), `tsconfig.json`, and empty `src/constructs/` and `src/index.ts`
- `_template/` folder with full directory structure and `.gitkeep` files where needed; `_template/infra/.env.example` and `_template/frontend/.env.example` populated
- `gato/` and `snake/` folders copied from `_template/` structure (no implementation files)
- `gato/spec.md` and `snake/spec.md` stubs referencing this document

**No CDK code, no frontend code, no application logic in this stage.**

---

### Stage 2 — @arcade/infra library

**Scope:** Implement the `GameStack` CDK construct. No game-specific stacks.

**Deliverables:**

- `infra/src/constructs/GameStack.ts` implementing the construct described in this spec
- `infra/src/constructs/GameBackendStack.ts` as a documented placeholder (interface only, no implementation)
- `infra/src/index.ts` exporting both
- `infra/package.json` with CDK v2 as a peer dependency and dev dependency
- `infra/tsconfig.json` targeting ES2020, strict mode
- Each game's `infra/bin/app.ts` consuming `GameStack` with values from `.env`
- Each game's `infra/.env.example` populated with all required variables
- Each game's `infra/cdk.json` configured for the app entry point

**Validation:** `npm --prefix infra run typecheck` must pass with no errors. This runs `tsc --noEmit` against `infra/tsconfig.json` regardless of the current shell or working directory. (Avoid `cd infra && npx tsc --noEmit`: `&&` is not valid in Windows PowerShell 5.1, and passing both `-p`/`--project` and source files to `tsc` fails with TS5042.)

**No frontend code in this stage. No `cdk deploy` is run.**

---

### Stage 3 — Frontend scaffolds

**Scope:** Initialize Astro + React + Vite + Vitest for each game's frontend. No application code.

**Deliverables (per game):**

- Astro project initialized with React integration and TypeScript strict mode
- `vite.config.ts` and `vitest.config.ts` configured
- Empty folder structure created with `.gitkeep`:
  ```
  frontend/src/
  ├── components/
  ├── i18n/
  │   ├── en.json       # Empty object {}
  │   └── es.json       # Empty object {}
  ├── lib/
  │   ├── constants/
  │   ├── engine/
  │   ├── state/
  │   └── validation/
  ├── layouts/
  ├── pages/
  └── styles/
  ```
- `frontend/.env.example` populated
- `vitest.config.ts` pointing to `src/**/*.test.ts` and `src/**/*.test.tsx`
- `.github/workflows/deploy-<game>.yml` with path filter, test gate, build, S3 sync, and CloudFront invalidation steps (secrets referenced, not hardcoded)

**No application code is written in this stage. Running `vitest` must report zero tests (no failures, no passes).**

---

### Stage 4 — Documentation

**Scope:** Complete all documentation files. No code changes.

**Deliverables:**

- Root `claude.md` — complete working instructions for Claude Code, including:
  - Monorepo overview
  - Full working style rules (from this spec)
  - Directory map with purpose of each folder
  - How to add a new game (step-by-step checklist)
  - How to update `@arcade/infra`
  - Security checklist
  - Environment variable reference
- Root `readme.md` — developer-facing setup and deployment guide, including:
  - Project description and game list
  - Prerequisites (Node 24, AWS CLI, CDK)
  - Monorepo setup (`npm install` at root)
  - Per-game local dev
  - Per-game infra deploy (CDK from local)
  - Per-game frontend deploy (GitHub Actions)
  - How to add a new game (brief; refers to `claude.md` for detail)

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-24 | Monorepo with npm workspaces | Games share infra constructs and conventions; not large enough to justify separate repos; a game that outgrows the monorepo can be extracted later |
| 2026-06-24 | `@arcade/infra` is a library, not a deployable stack | Avoids a shared deployable stack that all games depend on; each game owns its full infra lifecycle; the library is just reusable CDK code |
| 2026-06-24 | One CloudFront distribution per game | Each game is fully autonomous; no shared distribution means no cross-game deploy coupling; cost impact is negligible at low traffic |
| 2026-06-24 | Existing hosted zone and wildcard certificate; not managed by this repo | Both already exist; recreating them would risk DNS downtime; the library accepts them as props, keeping the repo infrastructure-agnostic for those two resources |
| 2026-06-24 | Infra deployed from local, frontend via GitHub Actions | Infra changes are infrequent and carry more risk; local deploy gives the developer direct control and visibility; frontend is safe to automate on every push |
| 2026-06-24 | GitHub Actions workflows at repo root `.github/workflows/` with path filters per game | GitHub only recognizes workflows at the repository root; path filters (`<game>/**`) achieve per-game isolation without subdirectory workflow files |
| 2026-06-24 | `_template/` committed to the repo | Single source of truth for the game contract; new games are scaffolded from it, so structural drift is visible as a diff against the template |
| 2026-06-24 | Astro + React + Vite + Vitest, Node 24 | Consistent with developer's established stack; Astro handles SSG cleanly for static games; React for UI components; Vitest for fast unit tests; Node 24 from the start avoids future migration |
| 2026-06-24 | TDD with Gherkin scenarios required for all games | Enforces spec-first discipline; game logic is inherently stateful and edge-case-heavy; defining scenarios before code prevents speculative features and makes regressions visible |
| 2026-06-24 | i18next + react-i18next for i18n | Mature, well-maintained library with native React integration, namespace support, interpolation, plurals, and browser language detection; eliminates the need for a custom resolver while staying consistent with the React ecosystem |
| 2026-06-24 | Feature-based architecture available as an opt-in per game | Layer-based structure (`engine/`, `state/`, `validation/`) is sufficient for simple games; feature-based organization scales better when a game has multiple distinct subsystems or screens; the choice is made per game in its `spec.md` before implementation begins |
| 2026-06-24 | No domain names, subdomains, or URLs hardcoded in source or documentation | Environment-specific values belong exclusively in `.env` files; documentation uses generic placeholders; prevents accidental exposure and makes the repo portable across environments |
| 2026-06-24 | No magic values; all constants in dedicated files | Prevents silent bugs when values are reused across game logic, UI, and tests; constants are the contract between layers |
| 2026-06-24 | Game logic in `src/lib/engine/` as pure functions | Pure functions are trivially testable in Node without a DOM; separating logic from rendering makes TDD practical and prevents coupling |
| 2026-06-24 | `GameBackendStack` placeholder created in Stage 2 | Reserves the interface for future backend games without implementing it prematurely; the placeholder documents the intended contract |
| 2026-06-24 | Each game's spec written and approved before Stage 1 of that game | The spec is the contract; starting implementation without it leads to speculative features and undocumented decisions |
| 2026-06-24 | `GameStack` S3 bucket uses `RemovalPolicy.RETAIN` (no auto-delete) | Versioning is enabled to keep asset history; retaining the bucket on stack deletion prevents accidental loss of deployed artifacts and version history; intentional teardown is an explicit manual step |
| 2026-06-24 | CloudFront origin uses S3 Origin Access Control (OAC) via `S3BucketOrigin.withOriginAccessControl` | OAC is the current AWS-recommended mechanism (supersedes legacy OAI); it keeps the bucket fully private while granting the distribution scoped read access |
| 2026-06-24 | SPA fallback rewrites both 403 and 404 to `200 /index.html` | The spec calls for "404 → 200"; with a private S3 origin behind OAC, missing keys surface as 403, so 403 must also be rewritten for client-side routing to work. This extends, and does not contradict, the documented behavior |
| 2026-06-24 | Security headers (CSP, HSTS, X-Content-Type-Options, frame DENY, referrer policy) applied via a CloudFront `ResponseHeadersPolicy` | Satisfies the Security Contract requirement that distributions include CSP; a single response-headers policy centralizes all security headers. Default CSP allows inline styles but not inline scripts; revisit per game if the build emits inline scripts |
| 2026-06-24 | Game CDK apps run via `tsx`; `.env` loaded with `dotenv` | `tsx` runs TypeScript CDK apps directly on Node 24 without a separate compile step; `dotenv` loads each game's `infra/.env` so all environment-specific values stay out of source, per the contract |
| 2026-06-24 | `@arcade/infra` consumed as TypeScript source (`main`/`types` → `src/index.ts`); no build step | Within the npm workspace, games type-check and run against the library source directly; avoids a separate library build/publish cycle. Validation is `tsc --noEmit`; module resolution is `Bundler` to allow extensionless imports |
| 2026-06-24 | Frontend stack pinned to current majors: Astro 5, React 19, Vitest 3, Vite 6 | "Latest" per the tech stack; chosen together for mutual compatibility and to avoid a near-term migration |
| 2026-06-24 | Split `vite.config.ts` (shared base) and `vitest.config.ts` (merges base via `mergeConfig`) | The contract lists both files as deliverables; the base holds the React plugin, the test config adds discovery/environment. Astro keeps its own Vite pipeline via `astro.config.ts`, so the standalone Vite config exists only for the test runner |
| 2026-06-24 | `@vitejs/plugin-react` for tests, `@astrojs/react` for dev/build | Astro's integration drives the build; Vitest needs a plain Vite React plugin to transform `.tsx` test files. They serve different pipelines and coexist |
| 2026-06-24 | `passWithNoTests: true` in Vitest config; test environment `jsdom` | Lets `vitest run` exit 0 with zero tests (the Stage 3 frontend-scaffold validation) instead of failing on "no test files"; `jsdom` is ready for future component tests |
| 2026-06-24 | `astro.config.ts` reads `PUBLIC_SITE_URL` via Vite `loadEnv` | Keeps the canonical site URL in `.env` only; no domain is hardcoded, consistent with the environment-variable contract |
| 2026-06-24 | Deploy workflows install at the workspace root (`npm ci`), then test/build per game by `--workspace` | A single root install resolves the shared `@arcade/infra` link and the hoisted lockfile; per-game `--workspace` targeting keeps each pipeline isolated. Bucket name and distribution id are passed as per-game GitHub secrets, not hardcoded |
| 2026-06-24 | `_template/frontend` scaffolded identically to the games | `_template/` is the single source of truth for game structure; keeping its config files in sync makes structural drift visible as a diff against the template |