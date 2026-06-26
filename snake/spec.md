# Snake — Game Spec

> This document is the source of truth for Claude Code on this game. It inherits the full contract defined in the monorepo `spec.md`. Read both documents fully before acting on any prompt. In case of conflict, the monorepo `spec.md` takes precedence unless a deviation is explicitly declared in the Deviations section below.

---

## Game Overview

Snake is a real-time arcade game with a **forest** look and feel. The player steers a snake around a fixed grid, eating fruit to score points and advance through endless levels. The game gets faster each level and rewards **efficiency**: a fruit is worth the most the instant it appears and loses value the longer it goes uneaten, down to a floor — so a high score comes from eating quickly, not from surviving long. The snake dies if it hits a wall, an obstacle, or itself.

Two play modes ship in this version: **Simple** (the player alone) and **Versus** (the player plus a machine-controlled snake on the same board). A third mode, **Remote** (two humans on separate devices), is reserved structurally but not implemented.

The game is bilingual (English / Spanish), supports light/dark themes, persists preferences and a game history in `localStorage`, and explains itself through a "How to play" modal. An in-progress game is never persisted: a refresh restarts from level 1.

**Subdomain:** Configured via `SUBDOMAIN` in `infra/.env`
**Folder:** `snake/`
**Backend required:** No

---

## Deviations from Monorepo Contract

None.

The **Remote** mode is reserved as a structural placeholder only (a value in the `GameMode` enum and a second-snake-capable state shape). No networking, no backend, and no UI to start a remote game exist in this version. When Remote is specified later it will require `GameBackendStack` and its own spec stage; until then the game remains `Backend required: No`.

---

## Game Rules

### Board

- The logical board is a fixed grid of **25 × 25** cells. Cells are addressed as `{ x, y }` with `x` the column and `y` the row, both `0..24`.
- The grid dimensions are constant and independent of the viewport. The canvas scales to the available space; the logical grid does not change.
- The four edges of the grid are solid walls. There is **no wrap-around**: a head that moves off any edge dies.

### Obstacles

- A fixed number of obstacles (`OBSTACLE_COUNT = 8`) are placed at random once, when a game starts, and **never change for the rest of that game** — not between levels, not on level-up.
- Obstacle placement is validated so the game is always playable: no obstacle overlaps a snake's starting body, the cell directly ahead of a starting snake (its first move), or another obstacle. Obstacles are not placed so as to fully enclose a starting position.
- A snake head that enters an obstacle cell dies.

### The snake

- Each snake starts with a body of `INITIAL_SNAKE_LENGTH = 3` segments and a heading.
- Movement is on a tick. On each tick the snake advances one cell in its current heading: the head moves forward, and the tail cell is removed — unless the snake is growing, in which case the tail stays and the body lengthens.
- A snake dies if, on a tick, its next head cell is: outside the grid, an obstacle, any cell of its own body, or (in Versus) any cell of the other snake.

### Fruit

- Fruit appears on random empty cells (never on a snake, an obstacle, or another fruit).
- In **Simple** mode, exactly `SIMPLE_FRUIT_COUNT = 1` regular fruit is on the board at a time; eating it immediately spawns a replacement.
- In **Versus** mode, `VERSUS_FRUIT_COUNT = 3` regular fruits are on the board at once; each eaten fruit is immediately replaced.
- Eating a **regular** fruit grows the snake by one segment, adds points (see Scoring), counts toward the level requirement, and updates the efficiency streak.
- A **bonus (golden) fruit** may additionally appear (see Efficiency bonus). It is extra to the regular fruit count and stays on the board until eaten. Eating it grows the snake and adds points, but it does **not** count toward the level requirement and does **not** affect the efficiency streak — it is purely a points reward.

### Levels

- There is no level cap. The board, snake, obstacles, and scores are continuous across levels; only **speed** and **fruits required** change at a level boundary.
- To advance from a level the snake must eat `fruitsRequiredThisLevel` **regular** fruits. The level requirement is independent of golden bonus fruits: golden fruits give points but never count toward `fruitsEatenThisLevel`.
- `fruitsRequiredThisLevel = max(MIN_FRUITS_REQUIRED, round(BASE_FRUITS_REQUIRED × FRUITS_DECAY^(level − 1)))`, with `BASE_FRUITS_REQUIRED = 12`, `FRUITS_DECAY = 0.9`, `MIN_FRUITS_REQUIRED = 4`. (Level 1 needs 12, decreasing ~10% per level down to a floor of 4 around level 11.)
- Speed increases 10% per level. The tick interval is `speedMs = round(BASE_SPEED_MS / SPEED_GROWTH^(level − 1))`, with `BASE_SPEED_MS = 140` and `SPEED_GROWTH = 1.1` (a smaller interval = faster).
- On level-up, `level` increments, `fruitsRequiredThisLevel` and `speedMs` are recomputed, and `fruitsEatenThisLevel` resets to 0.

### Scoring

- Each regular fruit type has a base value: cherry 5, apple 10, orange 15, watermelon 25 (`FRUIT_BASE_VALUE`). Fruit type at spawn is chosen by weighted random.
- A fruit is worth the most the instant it appears and decays **linearly** to a floor of 10% of its base value, never zero:
  `decayFactor(ticksElapsed) = max(DECAY_FLOOR, 1 − (1 − DECAY_FLOOR) × (ticksElapsed / DECAY_WINDOW_TICKS))`, with `DECAY_FLOOR = 0.1` and `DECAY_WINDOW_TICKS = 70` (≈10 s at base speed). `ticksElapsed = currentTick − fruitSpawnTick`. Beyond the window the factor stays at the floor.
- Points awarded on eating: `round(baseValue × decayFactor × modeMultiplier)`, where `modeMultiplier` is `SIMPLE_MULTIPLIER = 1` in Simple and `VERSUS_MULTIPLIER = 1.5` in Versus.
- A **golden (bonus) fruit** does not decay: it is always worth `round(GOLDEN_BASE_VALUE × modeMultiplier)`, with `GOLDEN_BASE_VALUE = 20`.
- Accelerating (the `a` boost) grants **no point bonus**. It only makes the snake reach fruit sooner, so less decay accrues — at the cost of more collision risk. Scoring is unchanged by boost state.

### Efficiency bonus

- The efficiency streak counts **consecutive regular fruits eaten at more than 60% of base value** (`decayFactor > EFFICIENCY_THRESHOLD`, `EFFICIENCY_THRESHOLD = 0.6`).
- Eating a regular fruit at 60% or below resets the streak to 0.
- When the streak reaches `EFFICIENCY_STREAK = 3`, one golden bonus fruit spawns and the streak resets to 0.
- Golden fruits do not affect the streak counter (they are neither counted toward it nor do they reset it), so the bonus cannot be trivially chained.

### Game over

- **Simple:** the game ends when the player's snake dies. The final score and level reached are recorded.
- **Versus:** the game ends as soon as **either** snake dies. The surviving snake's score is multiplied by 1.5 (`SURVIVOR_BONUS = 1.5`) — this realizes "whoever ends the game makes the other gain 50% extra." If both snakes die on the same tick, there is no survivor and no bonus is applied. Both final scores and the level reached are recorded.

---

## Controls

Movement uses **relative turning** (the snake turns, it does not jump to an absolute direction). A turn rotates the heading 90°. To prevent an accidental instant 180° reversal, only the first turn input received between two ticks is applied; further turn inputs within the same tick interval are ignored.

| Action | Keyboard | Touch / Mouse |
|---|---|---|
| Turn clockwise | `ArrowRight` | Tap the right half of the board |
| Turn counter-clockwise | `ArrowLeft` | Tap the left half of the board |
| Pause / resume | `p` | On-screen pause button |
| Boost on / off (toggle) | `a` | On-screen boost button |
| Start / new game | `Enter` or start button | Start / new game button |
| Open "How to play" | — | Help button |
| Close modal | `Escape` | Close button |

- **Boost** is a toggle: pressing `a` switches to boosted speed (`speedMs / BOOST_FACTOR`, `BOOST_FACTOR = 1.8`); pressing again returns to the level's normal speed. Boost is cleared on pause and on a new game.
- `ArrowUp` / `ArrowDown` are intentionally unused; the control scheme is relative-turn only.

---

## Game Modes

| Mode | Constant | Description |
|---|---|---|
| Simple | `SIMPLE` | The player's snake only. One fruit at a time. |
| Versus | `VERSUS` | Player snake + machine snake on one board. Three fruits at a time, worth ×1.5. Snakes cannot collide with each other. No win/lose against the machine; the survivor gets +50%. |
| Remote | `REMOTE` | **Reserved, not implemented.** Two humans on separate devices. No networking, backend, or UI in this version. |

### Machine snake (Versus)

The machine controls its own snake with the **same movement and collision rules** as the player. Its AI thinks only about **efficiency**: each tick it steers toward the nearest reachable fruit; if no fruit is safely reachable, it takes a survival move. It never tries to block or trap the player. (A harder, more adversarial AI is explicitly left for a future version or higher levels.)

**Pathfinding algorithm — breadth-first search (BFS).** Each tick the AI runs a BFS from the snake's head over the free cells (every cell that is not a wall, an obstacle, or part of any snake body). The grid is uniform-cost — every step to an adjacent cell costs exactly 1 — so BFS returns a shortest path and, because it expands in distance order, the first fruit its frontier reaches is the nearest fruit *by path distance* (not by straight-line distance). BFS also settles reachability for free: if the frontier empties without touching a fruit, no safe path exists and the AI switches to the survival fallback. The first step of the BFS path is converted into the rotation the machine applies this tick (`CW`, `CCW`, or none).

**Survival fallback.** When no fruit is reachable, or the chosen step is unsafe, the AI picks the safe neighbouring cell that maximises reachable free space (a flood-fill count), so it does not seal itself into a shrinking pocket.

See the Decisions Log for why BFS was chosen over Dijkstra and A*, and for the deferred refinements (freeing the moving tail cell, A* if the grid ever grows, adversarial play at higher levels).

---

## Game States

```
States:
  IDLE        → mode chosen, board/obstacles ready, snake placed, nothing moving
  PLAYING     → tick loop running
  PAUSED      → tick loop suspended mid-play
  GAME_OVER   → a death ended the game; final score(s) and level recorded; board frozen

Transitions:
  IDLE      → PLAYING    : player starts (first input or start button)
  PLAYING   → PAUSED     : player pauses ('p' / pause button)
  PAUSED    → PLAYING    : player resumes ('p' / pause button)
  PLAYING   → GAME_OVER  : a snake dies (Simple: player; Versus: either snake)
  GAME_OVER → IDLE       : player starts a new game (fresh obstacles, snake reset to level 1)
```

On `IDLE → PLAYING` the in-progress game holds no persisted state. A page refresh in any state discards the game and returns to `IDLE` at level 1.

---

## Data Model

### Core types

```typescript
type Position = { x: number; y: number };           // 0..24 each axis

type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';
type Rotation = 'CW' | 'CCW';

type FruitType = 'CHERRY' | 'APPLE' | 'ORANGE' | 'WATERMELON';
type SnakeId = 'player' | 'machine';

interface Snake {
  id: SnakeId;
  body: Position[];          // head at index 0
  direction: Direction;      // committed heading
  pendingTurn: Rotation | null; // at most one turn buffered per tick interval
  pendingGrowth: number;     // segments still to add (tail not trimmed while > 0)
  alive: boolean;
}

interface Fruit {
  id: string;                // crypto.randomUUID()
  type: FruitType;
  position: Position;
  spawnTick: number;         // tick when it appeared, for decay
  isBonus: boolean;          // golden fruit: no decay, does not affect streak
}
```

### Game state shape

```typescript
interface GameState {
  status: GameStatus;        // IDLE | PLAYING | PAUSED | GAME_OVER
  mode: GameMode;            // SIMPLE | VERSUS (REMOTE reserved)
  level: number;             // starts at 1
  tick: number;              // monotonic tick counter
  snakes: Snake[];           // [player] in SIMPLE; [player, machine] in VERSUS
  fruits: Fruit[];           // regular + any golden
  obstacles: Position[];     // fixed for the whole game
  scores: Record<SnakeId, number>;
  fruitsEatenThisLevel: number;
  fruitsRequiredThisLevel: number;
  efficiencyStreak: number;  // consecutive regular fruits eaten > 60% value
  boosted: boolean;          // boost toggle state
  speedMs: number;           // current tick interval (level + boost derived)
  survivor: SnakeId | null;  // Versus only: the snake that received the +50%
}
```

The pure engine never reads the clock or the DOM. The tick interval and the real-time loop live in the React controller (`useSnake`); the engine advances one tick given a state and returns a new state.

### Match record

Each finished game appends one record to `localStorage`.

```typescript
interface GameRecord {
  id: string;                // crypto.randomUUID()
  date: string;              // ISO 8601
  mode: GameMode;            // SIMPLE | VERSUS
  level: number;             // level reached
  playerScore: number;       // final player score (Versus: after any survivor bonus)
  machineScore?: number;     // Versus only: final machine score (after any survivor bonus)
  survivor?: SnakeId | null; // Versus only: who received the +50%, or null if both died
}
```

### localStorage keys

| Key | Shape | Purpose |
|---|---|---|
| `snake_prefs` | `{ language: string; theme: string; mode: GameMode }` | User preferences and last selected mode |
| `snake_history` | `GameRecord[]` | Full game history |

The in-progress `GameState` is intentionally **not** persisted.

### Fruit catalog (SVG)

Regular fruit and the golden bonus are drawn from inline, generated SVG sprites (no external image files, no user input in the path). Each `FruitType` maps to a base value and a spawn weight in `lib/constants/`. The golden fruit is a distinct visual reserved for the efficiency bonus.

---

## i18n Keys Required

```jsonc
// en.json — illustrative; es.json must mirror the exact key set
{
  "game.title": "Snake",
  "game.start": "Start",
  "game.newGame": "New game",
  "game.pause": "Pause",
  "game.resume": "Resume",
  "game.boost": "Boost",
  "game.score": "Score",
  "game.level": "Level",
  "game.gameOver": "Game over",

  "mode.label": "Game mode",
  "mode.simple": "Simple",
  "mode.versus": "Versus",

  "players.you": "You",
  "players.machine": "Machine",

  "result.scoreLine": "Score: {{score}}",
  "result.levelLine": "Level reached: {{level}}",
  "result.survivorBonus": "Survivor bonus +50%",
  "result.youWon": "You scored higher!",
  "result.machineWon": "The machine scored higher",
  "result.tie": "It's a tie",

  "help.title": "How to play",
  "help.open": "How to play",
  "help.goal": "Eat fruit fast — value drops the longer it waits. Don't hit the walls, the obstacles, or yourself.",
  "help.turnCw": "Right arrow / tap right: turn clockwise",
  "help.turnCcw": "Left arrow / tap left: turn counter-clockwise",
  "help.pause": "P: pause / resume",
  "help.boost": "A: boost on/off (faster, riskier)",
  "help.versus": "Versus: the machine plays its own snake. If either snake dies the game ends and the survivor gets +50%.",
  "help.close": "Close",

  "history.title": "Game history",
  "history.tabSimple": "Simple",
  "history.tabVersus": "Versus",
  "history.empty": "No games yet. Go play!",
  "history.clear": "Clear history",
  "history.clearConfirm": "Delete all game history? This cannot be undone.",
  "history.colDate": "Date",
  "history.colLevel": "Level",
  "history.colScore": "Score",
  "history.colYou": "You",
  "history.colMachine": "Machine",
  "history.prevPage": "Previous",
  "history.nextPage": "Next",
  "history.pageStatus": "Page {{current}} of {{total}}",

  "nav.language": "Language",
  "nav.theme": "Theme",

  "error.invalidStorage": "Some saved data was invalid and has been reset."
}
```

Spanish keys (`es.json`) mirror the same key set exactly, with non-empty values.

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
| Rendering | HTML5 Canvas 2D for the play field |
| Node | 24 |

**Architecture:** Layer-based with extra domain folders (the pattern Gato established with `history/`/`memes/`). Snake has a real-time game loop, multiple entities, an AI snake, and level/scoring subsystems, so the default `engine/`/`state/`/`validation/` is extended with `scoring/`, `level/`, `ai/`, and `history/`. The engine remains pure (one tick → new state, no DOM, no clock); the canvas renderer and the tick loop live in the components/controller layer. A fully feature-based reorganization was considered unnecessary at this scope.

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
    And the level is 1
    And the snake is placed but not moving

  Scenario: Obstacles are placed once and stay fixed
    Given a new game starts
    Then exactly 8 obstacles are placed on empty cells
    And no obstacle overlaps the snake's starting body or the cell ahead of it
    And the obstacles do not change when the level increases

  Scenario: Game starts on player action
    Given the game is in IDLE state
    When the player triggers the start action
    Then the game transitions to PLAYING state
    And the snake begins advancing on each tick

  Scenario: In-progress game is not persisted across refresh
    Given the game is in PLAYING state at level 3
    When the page is refreshed
    Then the game is in IDLE state at level 1
    And no in-progress game state was restored
```

### Feature: Movement and turning

```gherkin
Feature: Snake movement and relative turning

  Scenario: Snake advances one cell per tick
    Given the snake heads RIGHT
    When one tick elapses
    Then the head has moved one cell to the right
    And the tail cell has been removed (no growth pending)

  Scenario: Right arrow turns clockwise
    Given the snake heads UP
    When the player turns clockwise
    Then the snake heads RIGHT

  Scenario: Left arrow turns counter-clockwise
    Given the snake heads UP
    When the player turns counter-clockwise
    Then the snake heads LEFT

  Scenario: Only one turn is applied per tick interval
    Given the snake heads UP
    When the player turns clockwise twice before the next tick
    Then only the first turn is applied
    And the snake heads RIGHT, never DOWN
```

### Feature: Fruit, scoring, and efficiency

```gherkin
Feature: Eating fruit and scoring

  Scenario: Eating fruit grows the snake and scores points
    Given a fruit is on the cell ahead of the snake's head
    When the snake moves onto that cell
    Then the snake grows by one segment
    And points are added to the score
    And a replacement fruit appears on an empty cell

  Scenario: Fruit value decays over time but never reaches zero
    Given a fruit appeared this tick
    Then it is worth 100% of its base value
    When the decay window fully elapses without it being eaten
    Then it is worth 10% of its base value
    And it never drops below 10%

  Scenario: Efficiency streak spawns a golden fruit
    Given the player eats three regular fruits in a row each above 60% of base value
    Then a golden bonus fruit appears
    And the efficiency streak resets

  Scenario: A slow fruit breaks the efficiency streak
    Given the efficiency streak is 2
    When the player eats a regular fruit at 60% or below
    Then the efficiency streak resets to 0

  Scenario: Golden fruit does not decay
    Given a golden bonus fruit is on the board
    When several ticks elapse
    Then its value is unchanged when eaten
```

### Feature: Levels

```gherkin
Feature: Level progression

  Scenario: Level advances after eating the required regular fruit
    Given the level requires N regular fruits
    When the snake has eaten N regular fruits this level
    Then the level increases by one

  Scenario: Golden fruit does not count toward the level requirement
    Given the level requires N regular fruits
    And the snake has eaten N minus one regular fruits this level
    When the snake eats a golden bonus fruit
    Then the level does not advance
    And the fruits-eaten-this-level counter is unchanged
    And the speed increases by 10%
    And the required fruit count for the new level decreases by 10% (until the minimum)
    And the fruits-eaten-this-level counter resets

  Scenario: Required fruit count never drops below the minimum
    Given the level is high enough that the formula falls below 4
    Then the required fruit count is 4
```

### Feature: Game over (Simple)

```gherkin
Feature: Game over in Simple mode

  Scenario: Hitting a wall ends the game
    Given the snake is one cell from the edge heading outward
    When the snake moves
    Then the game transitions to GAME_OVER
    And the final score and level reached are recorded

  Scenario: Hitting an obstacle ends the game
    Given an obstacle is on the cell ahead of the snake
    When the snake moves
    Then the game transitions to GAME_OVER

  Scenario: Hitting itself ends the game
    Given the snake is long enough to collide with its own body
    When a turn sends the head into its body
    Then the game transitions to GAME_OVER

  Scenario: Restart after game over
    Given the game is in GAME_OVER state
    When the player starts a new game
    Then the game returns to IDLE at level 1
    And new obstacles are placed
    And the score resets to 0
```

### Feature: Versus mode

```gherkin
Feature: Versus mode with a machine snake

  Background:
    Given the game is set up in VERSUS mode
    And both the player and machine snakes are on the board

  Scenario: Three fruits are present and worth more
    Then three regular fruits are on the board at once
    And each fruit is worth 1.5 times its base value

  Scenario: The machine moves its own snake toward fruit
    Given a reachable fruit exists
    When ticks elapse
    Then the machine snake steers toward the nearest reachable fruit
    And it never moves into a wall, obstacle, or snake body when a safe move exists

  Scenario: Snakes cannot occupy each other
    When the machine head would move into the player's body
    Then the machine snake dies

  Scenario: A death ends the game and the survivor gets +50%
    Given both snakes are alive
    When the player's snake dies
    Then the game transitions to GAME_OVER
    And the machine's score is multiplied by 1.5
    And both final scores are recorded

  Scenario: Both snakes dying on the same tick gives no bonus
    Given both snakes' next heads are fatal on the same tick
    When that tick is processed
    Then the game transitions to GAME_OVER
    And no survivor bonus is applied
    And the survivor is recorded as null
```

### Feature: Controls

```gherkin
Feature: Player controls

  Scenario: Pause and resume
    Given the game is in PLAYING state
    When the player presses pause
    Then the game is in PAUSED state and nothing moves
    When the player presses pause again
    Then the game returns to PLAYING state

  Scenario: Boost toggles speed
    Given the game is in PLAYING state at normal speed
    When the player toggles boost on
    Then the tick interval shortens
    When the player toggles boost off
    Then the tick interval returns to the level's normal speed

  Scenario: Boost grants no point bonus
    Given the player eats a fruit while boosted
    Then the points awarded are the same as if not boosted (only decay differs)

  Scenario: Touch — tapping screen halves turns the snake
    Given the game is in PLAYING state on a touch device
    When the player taps the right half of the board
    Then the snake turns clockwise
    When the player taps the left half of the board
    Then the snake turns counter-clockwise
```

### Feature: Game history

```gherkin
Feature: Game history modal

  Scenario: History is split into Simple and Versus tabs
    Given games have been played in both modes
    When the player opens the history modal
    Then a Simple tab and a Versus tab are shown
    And each tab lists only its mode's games in reverse chronological order
    And each row shows date, level reached, and score(s)

  Scenario: Versus rows show both scores
    Given a Versus game was recorded
    When the player views the Versus tab
    Then the row shows the player's and the machine's final scores

  Scenario: Empty history state
    Given no games have been played in a mode
    When the player views that tab
    Then an empty state message is displayed

  Scenario: Long history is paginated
    Given more than 10 games exist in a tab
    When the player views that tab
    Then at most 10 rows are shown per page
    And pagination controls indicate the current and total page count

  Scenario: Pagination resets when switching tabs
    Given the player is on a later page of the Simple tab
    When the player switches to the Versus tab
    Then the Versus tab starts on its first page

  Scenario: Clear history requires confirmation
    Given at least one game exists
    When the player clicks "Clear history"
    Then a confirmation prompt is shown
    And history is not deleted until confirmed

  Scenario: Clear history confirmed
    Given the confirmation prompt is visible
    When the player confirms
    Then all game records are deleted from localStorage
    And the empty state message is shown
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
    And the preference is stored in localStorage under "snake_prefs"

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
    Then all UI text updates to English immediately
    And the preference is stored in localStorage under "snake_prefs"

  Scenario: Stored language persists on reload
    Given the user previously selected Spanish
    When the page reloads
    Then Spanish is used
```

### Feature: Security — input validation

```gherkin
Feature: Input validation and security

  Scenario: Invalid preferences are reset
    Given corrupted data exists in "snake_prefs"
    When the page loads
    Then the corrupted key is reset to its default value
    And a visible warning is shown

  Scenario: Tampered history record is discarded
    Given "snake_history" contains a record with an invalid shape
    When the page loads
    Then the invalid record is discarded
    And valid records are preserved

  Scenario: Non-array history fails safely
    Given "snake_history" does not contain an array
    When the page loads
    Then the history resets to an empty list
    And a visible warning is shown
```

---

## Unit Test Definitions

> Tests are defined here before implementation. No test is written without a definition here. No definition is added or modified after Stage 2 without developer authorization.

### Direction / turning (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-DIR-01` | Clockwise rotation cycles UP→RIGHT→DOWN→LEFT→UP | `rotate(dir, 'CW')` for each | Next clockwise direction |
| `T-DIR-02` | Counter-clockwise rotation cycles the other way | `rotate(dir, 'CCW')` for each | Next counter-clockwise direction |
| `T-DIR-03` | `move` advances a position by one cell in a direction | `move({x:5,y:5}, 'RIGHT')` | `{x:6,y:5}` |

### Engine — tick (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-ENG-01` | Initial state is IDLE, level 1, score 0 | `createInitialState(SIMPLE)` | `{ status: IDLE, level: 1, scores: { player: 0 }, ... }` |
| `T-ENG-02` | Tick advances head and trims tail when not growing | `advanceTick(state)` | Head moved one cell; body length unchanged |
| `T-ENG-03` | Eating a fruit grows the snake and trims no tail | `advanceTick` with fruit ahead | Body length +1; replacement fruit present |
| `T-ENG-04` | Head into wall kills the snake | `advanceTick` heading off the edge | Snake `alive: false`; status GAME_OVER (Simple) |
| `T-ENG-05` | Head into an obstacle kills the snake | obstacle ahead | Snake `alive: false` |
| `T-ENG-06` | Head into own body kills the snake | self-collision setup | Snake `alive: false` |
| `T-ENG-07` | Only the first buffered turn applies per tick | two turns queued | Direction reflects one rotation only |
| `T-ENG-08` | Spawned fruit is never on a snake, obstacle, or fruit | `spawnFruit(state, rng)` | Position is an empty cell |

### Scoring (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-SCORE-01` | Decay factor is 1.0 at spawn tick | `decayFactor(0)` | `1.0` |
| `T-SCORE-02` | Decay factor is the floor at the window end | `decayFactor(DECAY_WINDOW_TICKS)` | `0.1` |
| `T-SCORE-03` | Decay factor never drops below the floor | `decayFactor(DECAY_WINDOW_TICKS * 2)` | `0.1` |
| `T-SCORE-04` | Points = base × decay × multiplier, rounded | `fruitPoints(base=10, ticks=0, mult=1)` | `10` |
| `T-SCORE-05` | Versus multiplier applies | `fruitPoints(base=10, ticks=0, mult=1.5)` | `15` |
| `T-SCORE-06` | Golden fruit ignores decay | `fruitPoints` for a bonus fruit at any tick | `round(GOLDEN_BASE_VALUE × mult)` |

### Efficiency streak (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-EFF-01` | Eating above threshold increments the streak | streak 1, eat at 0.7 | streak 2 |
| `T-EFF-02` | Eating at or below threshold resets the streak | streak 2, eat at 0.6 | streak 0 |
| `T-EFF-03` | Reaching 3 spawns a golden fruit and resets the streak | streak 2, eat at 0.7 | golden fruit added; streak 0 |
| `T-EFF-04` | Golden fruit does not change the streak | streak 1, eat golden | streak still 1 |

### Levels (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-LVL-01` | Required fruit count uses the decay formula | `fruitsRequired(1)` | `12` |
| `T-LVL-02` | Required fruit count floors at the minimum | `fruitsRequired(large level)` | `4` |
| `T-LVL-03` | Speed interval shortens 10% per level | `speedForLevel(2)` | `round(140 / 1.1)` |
| `T-LVL-04` | Level advances when the regular-fruit requirement is met | state with `fruitsEatenThisLevel == required`, eat one more regular fruit | `level + 1`, counter reset |
| `T-LVL-05` | Golden fruit does not advance the level | state one regular fruit from level-up, eat a golden fruit | `level` unchanged, `fruitsEatenThisLevel` unchanged |

### Machine AI (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-AI-01` | Steers toward the nearest reachable fruit | state with one fruit | Returns the rotation that reduces distance to it |
| `T-AI-02` | Picks a safe move when no fruit path is safe | boxed-in-toward-fruit state | Returns a rotation whose next head is not fatal |
| `T-AI-03` | Never returns a move into a wall/obstacle/body when a safe one exists | constrained state | Chosen next head is a safe cell |

### Versus (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-VS-01` | Either snake dying ends the game | player dies | status GAME_OVER |
| `T-VS-02` | Survivor receives +50% | player dies, machine alive | `machine` score × 1.5; `survivor: 'machine'` |
| `T-VS-03` | Both dying same tick gives no bonus | both heads fatal same tick | scores unchanged; `survivor: null` |
| `T-VS-04` | A snake moving into the other dies | machine head into player body | machine `alive: false` |

### State transitions

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-ST-01` | IDLE → PLAYING on start | `transition(IDLE, 'START')` | `status: PLAYING` |
| `T-ST-02` | PLAYING → PAUSED on pause | `transition(PLAYING, 'PAUSE')` | `status: PAUSED` |
| `T-ST-03` | PAUSED → PLAYING on resume | `transition(PAUSED, 'RESUME')` | `status: PLAYING` |
| `T-ST-04` | PLAYING → GAME_OVER on death | `transition(PLAYING, 'DEATH')` | `status: GAME_OVER` |
| `T-ST-05` | GAME_OVER → IDLE on new game | `transition(GAME_OVER, 'NEW_GAME')` | `status: IDLE`, level 1, score 0 |

### Obstacles (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-OBST-01` | Generates exactly OBSTACLE_COUNT obstacles | `generateObstacles(state, rng)` | 8 distinct positions |
| `T-OBST-02` | No obstacle overlaps the snake or the cell ahead | `generateObstacles` | None on the starting body or its next cell |

### Game history

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-HIST-01` | `buildGameRecord` for Simple has score and level | finished Simple state | Record with `mode: SIMPLE`, `playerScore`, `level`, valid ISO date |
| `T-HIST-02` | `buildGameRecord` for Versus has both scores and survivor | finished Versus state | Record with `machineScore` and `survivor` set |
| `T-HIST-03` | `groupByMode` separates Simple and Versus records | mixed records | Two lists, each filtered by mode |

### localStorage validation

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-LS-01` | Valid `snake_prefs` passes | `{ language: "en", theme: "dark", mode: "SIMPLE" }` | Returns parsed object |
| `T-LS-02` | Invalid theme value fails | `{ language: "en", theme: "blue", mode: "SIMPLE" }` | Returns error result; default applied |
| `T-LS-03` | Invalid mode value fails | `{ language: "en", theme: "dark", mode: "X" }` | Returns error result; default applied |
| `T-LS-04` | Tampered JSON resets to default | `"{{not json}}"` | Returns error result; default applied |
| `T-LS-05` | Valid `snake_history` array passes | array of valid `GameRecord` | Returns parsed array |
| `T-LS-06` | Record with missing field is discarded | array with one invalid record | Valid records preserved, invalid discarded |
| `T-LS-07` | Non-array `snake_history` fails | `"not an array"` | Returns error result; empty list applied |

### i18n

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-I18N-01` | EN and ES files have identical key sets | `en.json`, `es.json` | Key sets are equal |
| `T-I18N-02` | No key has an empty string value | `en.json`, `es.json` | All values non-empty |

---

## Implementation Stages

Stages are executed in strict order. Claude Code stops after each stage and waits for developer authorization to proceed.

---

### Stage 1 — Infra

**Scope:** Deploy the game's AWS infrastructure. No frontend code.

**Deliverables:**

- `infra/bin/app.ts` consuming `GameStack` from `@arcade/infra` with `STACK_ID = 'SnakeStack'`
- `infra/.env.example` with all required variables
- `infra/cdk.json` configured
- `infra/readme.md` with deploy instructions

**Validation:** `npx tsc --noEmit` passes. Developer runs `cdk deploy` from local and confirms the subdomain resolves.

---

### Stage 2 — Failing tests

**Scope:** Write all unit tests defined in this spec. All tests must fail (no implementation exists).

**Files created:**

- `frontend/src/lib/engine/__tests__/direction.test.ts` — T-DIR-*
- `frontend/src/lib/engine/__tests__/engine.test.ts` — T-ENG-*
- `frontend/src/lib/engine/__tests__/obstacles.test.ts` — T-OBST-*
- `frontend/src/lib/scoring/__tests__/scoring.test.ts` — T-SCORE-*
- `frontend/src/lib/scoring/__tests__/efficiency.test.ts` — T-EFF-*
- `frontend/src/lib/level/__tests__/level.test.ts` — T-LVL-*
- `frontend/src/lib/ai/__tests__/ai.test.ts` — T-AI-*
- `frontend/src/lib/engine/__tests__/versus.test.ts` — T-VS-*
- `frontend/src/lib/state/__tests__/transitions.test.ts` — T-ST-*
- `frontend/src/lib/history/__tests__/history.test.ts` — T-HIST-*
- `frontend/src/lib/validation/__tests__/localStorage.test.ts` — T-LS-*
- `frontend/src/i18n/__tests__/i18n.test.ts` — T-I18N-*

**Constraints:**

- No implementation files created in this stage
- Running `vitest` must report all tests as failing
- No test is modified after this stage without developer authorization

---

### Stage 3 — Implementation

**Scope:** All application code that makes Stage 2 tests pass, plus the full UI.

**Order within this stage:**

1. Constants and enums (`GameStatus`, `GameMode`, `Direction`, `Rotation`, `FruitType`, `Theme`, `Language`, grid size, obstacle count, speed/level/scoring/efficiency constants, storage keys)
2. i18n setup — i18next config, `en.json`, `es.json`
3. localStorage validation layer (`snake_prefs`, `snake_history`) and the shared result type
4. Direction helpers (`rotate`, `move`) — pure
5. Scoring (`decayFactor`, `fruitPoints`) and efficiency streak — pure
6. Level math (`fruitsRequired`, `speedForLevel`, level-up) — pure
7. Obstacle generation — pure (RNG injected)
8. Engine — `createInitialState`, `advanceTick`, fruit spawn, collision/eat/grow resolution (Simple and Versus) — pure
9. Machine AI — `getMachineTurn` (BFS to the nearest reachable fruit, flood-fill survival fallback) — pure
10. State transitions — `transition` and the `useSnake` React controller (real-time loop, timers, input handling, localStorage side effects, recording games)
11. Game history — `buildGameRecord`, `groupByMode`
12. React components:
    - `GameCanvas` — renders grid, snakes, obstacles, fruit (SVG sprites) per frame
    - `Hud` — score, level, mode, boost/pause indicators
    - `Controls` — on-screen pause/boost buttons and touch-half tap targets
    - `HelpModal` — controls and rules
    - `HistoryModal` — Simple/Versus tabs, pagination, clear action
    - `ModeSelector`
    - `ThemeToggle`, `LanguageToggle`
    - `App` — wires everything to `useSnake`
13. Astro page and layout — single page rendering `<App client:only="react" />`
14. CSS — forest aesthetic, CSS custom properties for both themes, responsive canvas

**After each sub-step, run `vitest`. Proceed only when all tests covering that sub-step pass.**

---

### Stage 4 — Documentation

**Scope:** Complete all documentation. No code changes.

**Deliverables:**

- `snake/spec.md` — finalize decisions log
- `snake/claude.md` — game-specific Claude Code instructions
- `snake/readme.md` — local dev setup, test, and deploy instructions

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-25 | Forest look and feel; fruit and snake drawn as inline generated SVG sprites | Matches the requested theme; inline SVG keeps assets in-repo with no external files and no user input in any image path, satisfying the security contract |
| 2026-06-25 | Play field rendered on an HTML5 Canvas 2D; engine stays pure and DOM-free | A real-time tick loop redraws the whole board each frame; canvas is the most efficient fit and keeps rendering out of the testable engine, which produces state per tick |
| 2026-06-25 | No wrap-around; walls are fatal | Stated in the bases — hitting the wall ends the game |
| 2026-06-25 | 8 fixed obstacles placed once at game start, never changing across levels | The bases call for a "reasonable, non-changing" amount; fixed placement keeps each game's challenge stable while levels scale speed instead of layout |
| 2026-06-25 | Continuous board across levels; only speed and required-fruit count change on level-up | Levels are thresholds, not new boards; the snake, obstacles, and score persist, so leveling raises difficulty without resetting progress |
| 2026-06-25 | Speed +10% compounding per level; required regular fruits start at 12 and decrease ~10% per level with a floor of 4 | Compounding speed plus a decreasing fruit requirement keeps early levels learnable and later levels fast without becoming impossible. The starting count (12) and floor (4) — raised from an initial 5/2 — give several chances to chain the 3-fruit efficiency streak per level and leave more margin once the speed has climbed |
| 2026-06-25 | Fruit value decays linearly from 100% to a 10% floor over a fixed tick window; never zero | Realizes the efficiency premise from the bases; a tick-based window keeps the engine pure and deterministic (no clock reads) while the floor guarantees a fruit is always worth eating |
| 2026-06-25 | Boost grants no point bonus; its only effect is reaching fruit before more decay accrues | The developer confirmed efficiency is the sole scoring lever; boost adds risk/reward through timing, not a multiplier |
| 2026-06-25 | Efficiency bonus: 3 consecutive regular fruits eaten above 60% spawn one non-decaying golden fruit; golden fruits are excluded from the streak | Matches the bases; excluding golden fruits from the streak prevents trivial chaining of bonuses |
| 2026-06-25 | The per-level fruit requirement counts only regular fruits; golden bonus fruits give points but never advance the level | The level expectation is independent of the reward mechanic — golden fruits are a points bonus, not progression. Counting them would let the efficiency reward also shorten levels, conflating two systems the developer wants kept separate |
| 2026-06-25 | Versus: a death by either snake ends the game; the survivor's score is multiplied by 1.5; simultaneous deaths give no bonus | Interprets "whoever ends the game makes the other gain 50% extra" — the one who dies hands the survivor a +50% bonus; both scores are recorded so the history shows who scored more, with no hard win/lose |
| 2026-06-25 | Versus machine AI optimizes only for efficiency (nearest reachable fruit, safe fallback), never adversarial | The developer chose a non-blocking, predictable opponent for v1; a harder/adversarial AI is deferred to a future version or higher levels |
| 2026-06-25 | Machine AI pathfinding uses **breadth-first search (BFS)**, chosen over Dijkstra and A* | The board is a uniform-cost grid (every step costs 1). Dijkstra is built for variable edge weights; with equal weights it degenerates into BFS while adding priority-queue overhead, so it buys nothing here. A* is a directed BFS (Manhattan heuristic) that only pays off on large search spaces; at 25×25 (625 cells) running a few times per second, a plain BFS is fast enough and far simpler to reason about and unit-test. BFS also gives "nearest fruit by path distance" and reachability for free by expanding in distance order. **Pending for the future:** (1) treat the moving tail cell as free rather than blocked, since it vacates next tick (currently conservative — all snake bodies are blocked); (2) revisit A* if the grid is ever enlarged enough that BFS cost matters; (3) the deferred adversarial behaviour (blocking/trapping the player) noted in the row above. The locked `T-AI-*` tests assert only "moves closer to the fruit" and "picks a safe move", so they do not pin the algorithm and remain valid under BFS |
| 2026-06-25 | Remote mode reserved as a `GameMode` value and a second-snake-capable state shape only; no networking or backend | The bases ask for structural preparation without implementation; reserving the enum and state shape lets Remote be added later without reshaping the engine, while the game stays backend-free |
| 2026-06-25 | Relative-turn controls only (CW/CCW); at most one turn applied per tick interval | The bases define left/right as relative rotation; capping to one turn per tick prevents an accidental instant 180° reversal into the snake's own body |
| 2026-06-25 | Touch control: tap right half = clockwise, tap left half = counter-clockwise, with on-screen pause/boost buttons | The bases only defined keyboard input; half-screen taps mirror the relative-turn scheme and are unambiguous on small screens |
| 2026-06-25 | Boost is a toggle (`a`), not hold | Matches "accelerate / return to current speed" wording in the bases |
| 2026-06-25 | In-progress game is never persisted; only `snake_prefs` and `snake_history` are stored | Stated in the bases — a refresh restarts at level 1; persisting only preferences and history keeps storage minimal and avoids resuming a real-time game mid-tick |
| 2026-06-25 | History split into Simple and Versus tabs, paginated at 10 rows/page with a confirmed clear action | Mirrors the bases and reuses the Gato history pattern (tabs + pagination + clear); pagination is presentation-only, slicing in the modal component |
| 2026-06-25 | Layer-based architecture extended with `scoring/`, `level/`, `ai/`, `history/` domain folders | Snake is more complex than Gato (real-time loop, AI, levels) but not enough to justify a full feature-based reorg; extra domain folders alongside the default layers keep pure logic separated and testable |
| 2026-06-25 | In Versus, level progression and the efficiency streak are driven by the **player's** regular fruits only; the machine's eating scores points but never advances the player's level or spawns a golden fruit | Level and speed are global to the shared board, but progression and the efficiency reward belong to the player. The machine is a scoring rival, not a co-driver of the player's level; tying the level to whichever snake happens to eat would make pacing erratic and hand the player free speed-ups from the AI |
| 2026-06-25 | The pure `transition('NEW_GAME')` returns a fresh IDLE state (per `T-ST-05`); the `useSnake` controller composes NEW_GAME with an immediate START so "New game" replays in one click | Keeps the FSM transition pure and spec-faithful while removing replay friction in the UI — the same composition pattern Gato used for its "New game" flow. The controller, not the engine, owns this convenience |
| 2026-06-25 | Fruit sprites are recognizable SVG silhouettes (cherry, apple, orange, watermelon slice, golden star) generated inline, pre-rendered to `Image`, and drawn with `drawImage`; a colour circle is the fallback while a sprite decodes | Realizes the "generated SVG fruit" intent from the bases with distinct, readable shapes rather than plain coloured dots. Pre-rendering once keeps the per-frame canvas draw cheap; the fallback avoids a blank frame on first paint. Sprite colours live in the sprite module (they are art, not game data) |
| 2026-06-25 | Enter key documented in the "How to play" modal as a control | Enter already started/restarted the game in `useSnake`; the modal omitted it. Added `help.enter` i18n key to both locales and a list item in `HelpModal` so the control is discoverable |
| 2026-06-25 | Restart button appears in Controls when the game is paused; Enter also restarts from paused | Allows abandoning a run without resuming first. The button reuses the existing `onNewGame` / `newGame` callback (reset + immediate start). A distinct `game.restart` i18n key is used instead of `game.newGame` to make intent clear in context. The Enter key handler in `useSnake` was extended to treat `PAUSED` the same as `GAME_OVER` for the restart action |
| 2026-06-25 | Versus history rows show the golden star SVG next to the higher score; no star on a tie | Gives an at-a-glance winner indicator that reuses the game's existing star art, keeping visual language consistent. The star is an inline SVG component in `HistoryModal` — same path data as the `GOLDEN` fruit sprite in `fruitSprites.ts` |
