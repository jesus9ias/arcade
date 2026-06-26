# <GameName> — Game Spec

> This document is the source of truth for Claude Code on this game. It inherits the full contract defined in the monorepo `spec.md`. Read both documents fully before acting on any prompt. In case of conflict, the monorepo `spec.md` takes precedence unless a deviation is explicitly declared in the Deviations section below.

---

## Game Overview

<!-- One paragraph describing the game: what it is, how it plays, win/lose conditions, target feel. -->

**Subdomain:** Configured via `SUBDOMAIN` in `infra/.env`
**Folder:** `<game>/`
**Backend required:** Yes / No

---

## Deviations from Monorepo Contract

<!-- List any deliberate deviations from spec.md here. Each deviation must have been confirmed by the developer before implementation. If there are none, write "None." -->

None.

---

## Game Rules

<!-- Precise, unambiguous rules. Define all edge cases. Examples:
  - Board dimensions
  - Win condition
  - Lose condition
  - Draw condition (if applicable)
  - Turn structure (if applicable)
  - Scoring (if applicable)
-->

---

## Controls

<!-- Define all input methods. Be explicit about keyboard keys, touch gestures, and mouse interactions. -->

| Action | Keyboard | Touch / Mouse |
|---|---|---|
| | | |

---

## Game States

<!-- Enumerate every state the game can be in. Define all valid transitions between states. -->

```
States:
  IDLE        → player has not started yet
  PLAYING     → game is running
  PAUSED      → game is suspended mid-play (if applicable)
  GAME_OVER   → game has ended (win or lose)

Transitions:
  IDLE     → PLAYING    : player starts the game
  PLAYING  → PAUSED     : player pauses (if applicable)
  PAUSED   → PLAYING    : player resumes
  PLAYING  → GAME_OVER  : win or lose condition met
  GAME_OVER → IDLE      : player restarts
```

---

## Data Model

<!-- Define all data structures the game uses. No implementation details — just shapes and semantics. -->

### Game state shape

```typescript
// Example — replace with actual shape
interface GameState {
  status: GameStatus;   // enum: IDLE | PLAYING | PAUSED | GAME_OVER
  score: number;
  // ...
}
```

### localStorage keys

| Key | Shape | Purpose |
|---|---|---|
| `<game>_prefs` | `{ language, theme }` | User preferences |
| | | |

---

## i18n Keys Required

<!-- List all user-visible strings the game needs. Both en.json and es.json must have identical key sets. Managed via i18next + react-i18next. -->

```jsonc
// en.json — illustrative, not exhaustive
{
  "game.title": "...",
  "game.start": "Start",
  "game.restart": "Restart",
  "game.score": "Score",
  "game.gameOver": "Game Over",
  "game.paused": "Paused",
  "nav.language": "Language",
  "nav.theme": "Theme"
}
```

---

## Frontend Stack

Inherits the monorepo standard:

| Concern | Technology |
|---|---|
| Meta-framework | Astro (latest) — SSG |
| UI framework | React (latest) |
| Language | TypeScript (strict) |
| Bundler | Vite (latest, via Astro) |
| Testing | Vitest (latest) |
| i18n | i18next + react-i18next |
| Node | 24 |

**Architecture:** <!-- layer-based (default) or feature-based — declare here before Stage 1 and justify if feature-based -->

<!-- Add game-specific libraries here if needed, with rationale. -->

---

## Backend Stack

<!-- Remove this section if backend is not required. -->

| Concern | Technology |
|---|---|
| API | API Gateway (HTTP API) |
| Compute | Lambda (Node 24) |
| Database | DynamoDB (single-table) |
| IaC | `GameBackendStack` from `@arcade/infra` |

### API endpoints

<!-- Define all endpoints. Example:
  POST /scores    — submit a score
  GET  /scores    — get top 10 scores
-->

### DynamoDB table design

<!-- Define the single-table schema: PK, SK, GSIs, and access patterns. -->

---

## Environment Variables

### `infra/.env`

```
SUBDOMAIN=              # Game subdomain prefix
DOMAIN_NAME=            # Parent domain from your DNS setup
HOSTED_ZONE_ID=
CERTIFICATE_ARN=
AWS_ACCOUNT_ID=
AWS_REGION=             # us-east-1
AWS_PROFILE=            # Optional
```

### `frontend/.env`

```
PUBLIC_SITE_URL=        # Full URL of the deployed game
```

---

## Gherkin Feature Specifications

> All scenarios must be defined here before Stage 2 (failing tests) begins. No scenario is added or modified after Stage 2 without developer authorization.

### Feature: Game initialization

```gherkin
Feature: Game initializes correctly

  Scenario: Idle state on first load
    Given the player opens the game
    Then the game is in IDLE state
    And the score is 0
    And no game elements are moving

  Scenario: Game starts on player action
    Given the game is in IDLE state
    When the player triggers the start action
    Then the game transitions to PLAYING state
```

### Feature: Core gameplay

```gherkin
Feature: Core gameplay mechanics

  # Add scenarios for all core game mechanics here.
  # Be exhaustive — every rule defined above must have at least one scenario.
```

### Feature: Game over

```gherkin
Feature: Game over

  Scenario: Lose condition is met
    Given the game is in PLAYING state
    When <lose condition>
    Then the game transitions to GAME_OVER state
    And the final score is displayed

  Scenario: Player restarts after game over
    Given the game is in GAME_OVER state
    When the player triggers restart
    Then the game transitions to IDLE state
    And the score resets to 0
```

### Feature: Score

```gherkin
Feature: Score tracking

  # Add scoring scenarios here if the game has a score.
```

### Feature: Controls

```gherkin
Feature: Player controls

  # Add one scenario per control action defined in the Controls section.
```

### Feature: Theme

```gherkin
Feature: Theme (light / dark)

  Scenario: Default theme from system preference
    Given the user's system prefers dark mode
    And no theme preference is stored
    When the page loads
    Then the dark theme is applied

  Scenario: User overrides theme
    When the user toggles the theme
    Then the theme switches
    And the preference is stored in localStorage

  Scenario: Stored preference is respected on reload
    Given the user previously selected light theme
    When the page reloads
    Then the light theme is applied regardless of system preference
```

### Feature: Language

```gherkin
Feature: Language switcher (English / Spanish)

  Scenario: Default language from browser
    Given the browser language is "es"
    And no language preference is stored
    When the page loads
    Then Spanish is used for all UI text

  Scenario: User switches language
    When the user selects "English"
    Then all UI text updates to English
    And the preference is stored in localStorage

  Scenario: Stored language persists on reload
    Given the user previously selected Spanish
    When the page reloads
    Then Spanish is used
```

### Feature: Security — input validation

```gherkin
Feature: Input validation and security

  Scenario: Invalid localStorage data is reset
    Given corrupted data exists in <game>_prefs in localStorage
    When the page loads
    Then the corrupted key is reset to its default value
    And a visible warning is shown

  # Add game-specific input validation scenarios here.
```

---

## Unit Test Definitions

> Tests are defined here before implementation. No test is written without a definition here. No definition is added or modified after Stage 2 without developer authorization.

### Game engine — pure logic

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-ENG-01` | Initial state is IDLE with score 0 | `createInitialState()` | `{ status: IDLE, score: 0, ... }` |
| | | | |

### Game state transitions

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-ST-01` | IDLE → PLAYING on start | `transition(IDLE_STATE, 'START')` | State with `status: PLAYING` |
| `T-ST-02` | PLAYING → GAME_OVER on lose condition | `transition(PLAYING_STATE, 'LOSE')` | State with `status: GAME_OVER` |
| `T-ST-03` | GAME_OVER → IDLE on restart | `transition(GAME_OVER_STATE, 'RESTART')` | State with `status: IDLE, score: 0` |
| | | | |

### localStorage validation

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-LS-01` | Valid prefs pass validation | `{ language: "en", theme: "dark" }` | Returns parsed object |
| `T-LS-02` | Invalid theme value fails | `{ language: "en", theme: "blue" }` | Returns error result |
| `T-LS-03` | Tampered JSON resets to default | `"{{not json}}"` | Returns error result, default applied |
| | | | |

### i18n

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-I18N-01` | EN and ES files have identical key sets | `en.json`, `es.json` | Key sets are equal |
| `T-I18N-02` | No key has an empty string value | `en.json`, `es.json` | All values non-empty |
| `T-I18N-03` | _(optional)_ Resolve returns correct string for known key | `("game.start", "en")` | `"Start"` |
| `T-I18N-04` | _(optional)_ Resolve returns key itself for unknown key | `("game.unknown", "en")` | `"game.unknown"` |
| | | | |

---

## Implementation Stages

Stages are executed in strict order. Claude Code stops after each stage and waits for developer authorization to proceed.

---

### Stage 1 — Infra

**Scope:** Deploy the game's AWS infrastructure. No frontend code.

**Deliverables:**

- `infra/bin/app.ts` consuming `GameStack` from `@arcade/infra`
- `infra/.env.example` with all required variables
- `infra/cdk.json` configured
- `infra/readme.md` with deploy instructions

**Validation:** `npx tsc --noEmit` passes. Developer runs `cdk deploy` from local and confirms the subdomain resolves.

---

### Stage 2 — Failing tests

**Scope:** Write all unit tests defined in this spec. All tests must fail at this stage (no implementation exists).

**Files created:**

- `frontend/src/lib/engine/__tests__/engine.test.ts` — T-ENG-*
- `frontend/src/lib/state/__tests__/transitions.test.ts` — T-ST-*
- `frontend/src/lib/validation/__tests__/localStorage.test.ts` — T-LS-*
- `frontend/src/i18n/__tests__/i18n.test.ts` — T-I18N-*
- <!-- Add game-specific test files here -->

**Constraints:**

- No implementation files are created in this stage
- Running `vitest` must report all tests as failing
- No test is modified after this stage without developer authorization

---

### Stage 3 — Implementation

**Scope:** Write all application code that makes Stage 2 tests pass, plus the full UI.

**Order within this stage:**

1. Constants and enums (`GameStatus`, `Language`, `Theme`, storage keys)
2. i18n module (`en.json`, `es.json`, resolve function)
3. localStorage validation layer
4. Game engine — pure functions (logic only, no DOM)
5. State management layer
6. React components — UI only, consuming state
7. Astro pages and layouts
8. CSS — custom properties for both themes, responsive
9. Infra behaviors update (if backend was added)

**After each sub-step, run `vitest`. Proceed only when all tests covering that sub-step pass.**

---

### Stage 4 — Documentation

**Scope:** Complete all documentation files. No code changes.

**Deliverables:**

- `<game>/spec.md` — finalize all decisions and decisions log
- `<game>/claude.md` — game-specific Claude Code instructions:
  - Game overview
  - Working style (inherits monorepo rules; add game-specific rules)
  - Directory map
  - How to modify game rules or add features
  - Security checklist
- `<game>/readme.md` — local dev setup, test, and deploy instructions

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| | | |