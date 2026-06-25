# Gato — Game Spec

> This document is the source of truth for Claude Code on this game. It inherits the full contract defined in the monorepo `spec.md`. Read both documents fully before acting on any prompt. In case of conflict, the monorepo `spec.md` takes precedence unless a deviation is explicitly declared in the Deviations section below.

---

## Game Overview

Gato is a Tic-tac-toe implementation with an informal, lighthearted look and feel. A human player chooses their symbol (X or O) and enters their name before playing. They can face the machine or a second human player. The game tracks a match history in localStorage and celebrates (or mocks) outcomes with random meme images overlaid on the board.

**Subdomain:** Configured via `SUBDOMAIN` in `infra/.env`
**Folder:** `gato/`
**Backend required:** No

---

## Deviations from Monorepo Contract

None.

---

## Game Rules

- The board is 3×3, cells indexed 0–8 (row-major order).
- Two symbols are used: `X` and `O`. The human player chooses one at game setup; the opponent takes the other.
- Players alternate turns. The human player always goes first.
- A player wins by occupying any of the 8 winning lines: 3 rows, 3 columns, 2 diagonals.
- The game ends in a draw if all 9 cells are filled with no winner.
- In Human vs Machine mode, the machine plays automatically after the human's turn.
- In Human vs Human mode, players share the same device and alternate turns manually.
- A completed game is recorded in localStorage before the meme overlay is shown.
- The board is locked (no moves accepted) once the game is in `GAME_OVER` state.

### Machine difficulty

The machine plays optimally using the minimax algorithm. There is no difficulty setting in this version.

---

## Controls

| Action | Keyboard | Mouse / Touch |
|---|---|---|
| Place symbol | — | Click / tap an empty cell |
| Close meme overlay | `ESC` | Click the close button |
| Confirm modal | `Enter` | Click confirm button |
| Close modal | `ESC` | Click close / cancel button |

---

## Game Modes

| Mode | Constant | Description |
|---|---|---|
| Human vs Machine | `HVM` | One human player against the minimax AI |
| Human vs Human | `HVH` | Two human players on the same device |

---

## Game States

```
States:
  SETUP       → player name(s) and symbol not yet confirmed
  IDLE        → setup complete, board empty, waiting for first move
  PLAYING     → game in progress, a move is expected
  GAME_OVER   → win or draw condition met; board locked; meme shown

Transitions:
  SETUP     → IDLE       : player confirms name(s) and symbol selection
  IDLE      → PLAYING    : human places first move
  PLAYING   → PLAYING    : a valid move is made and the game continues
  PLAYING   → GAME_OVER  : win or draw condition is detected after a move
  GAME_OVER → IDLE       : player starts a new game while players are registered (board cleared, same players)
  GAME_OVER → SETUP      : player starts a new game with no registered players (name modal opens)
```

---

## Data Model

### Board

The board is a flat array of 9 cells. Each cell holds a symbol or is empty.

```typescript
type CellValue = 'X' | 'O' | null;
type Board = [CellValue, CellValue, CellValue,
              CellValue, CellValue, CellValue,
              CellValue, CellValue, CellValue];
```

Winning line indices (constant, never computed at runtime):

```typescript
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],             // diagonals
] as const;
```

### Game state shape

```typescript
interface GameState {
  status: GameStatus;         // SETUP | IDLE | PLAYING | GAME_OVER
  mode: GameMode;             // HVM | HVH
  board: Board;
  currentTurn: Symbol;        // 'X' | 'O'
  humanSymbol: Symbol;        // chosen by the human player at setup
  playerOne: string;          // name of the human (or first human in HVH)
  playerTwo: string;          // name of the machine ("Machine") or second human
  winner: Symbol | 'DRAW' | null;
  winningLine: number[] | null;
  turnCount: number;          // increments on each valid move
}
```

### Match record

Each completed game produces one record appended to localStorage.

```typescript
interface MatchRecord {
  id: string;               // crypto.randomUUID()
  date: string;             // ISO 8601
  mode: GameMode;           // HVM | HVH
  playerOne: string;        // name at time of match
  playerTwo: string;        // name at time of match (or "Machine")
  humanSymbol: Symbol;      // symbol the human chose
  winner: Symbol | 'DRAW';  // winning symbol, or DRAW
  winnerName: string;       // resolved name of the winner, or i18n key for draw
  turns: number;            // total moves made in the match
}
```

### localStorage keys

| Key | Shape | Purpose |
|---|---|---|
| `gato_prefs` | `{ language: string; theme: string; mode: GameMode; playerOne: string; playerTwo: string; humanSymbol: Symbol; lastHumanPlayerTwo?: string }` | User preferences and last known player setup. `lastHumanPlayerTwo` remembers the most recent **human** Player 2 name (never the machine label) so the modal can prefill it when switching to HVH |
| `gato_history` | `MatchRecord[]` | Full match history |

### Meme catalog structure

The developer provides meme image files. Claude Code only creates the folder structure and the loading logic. Images are never committed by Claude Code.

```
gato/frontend/public/memes/
├── win/        # Human beat the machine
├── lose/       # Machine beat the human
└── neutral/    # Draw, or Human vs Human result
```

A meme is selected by picking a random file from the appropriate subfolder at `GAME_OVER` time. The catalog is read at runtime from a static JSON manifest (`src/lib/memes/catalog.json`) imported by the loader — not by scanning the filesystem at runtime. The manifest is regenerated by the developer with `npm run gen:memes`, which scans `public/memes/{win,lose,neutral}/` and writes the file. Image binaries themselves are never committed by Claude Code.

```jsonc
// src/lib/memes/catalog.json — generated by `npm run gen:memes`, not by Claude Code committing images.
// Conforms to the MemeCatalog type in src/lib/memes/memes.ts:
{
  "win": [],      // filenames under public/memes/win/
  "lose": [],     // filenames under public/memes/lose/
  "neutral": []   // filenames under public/memes/neutral/
}
```

The meme category resolved per outcome:

| Outcome | Mode | Meme category |
|---|---|---|
| Human wins | HVM | `win` |
| Machine wins | HVM | `lose` |
| Draw | HVM | `neutral` |
| Any result | HVH | `neutral` |

---

## Main screen

Below the header, the game screen shows, in order:

- **Players bar** — one chip per player (symbol glyph + name). The chip of the player whose turn it is is highlighted (`aria-current`); on game over the winner's chip is highlighted (neither chip on a draw). Clicking a chip opens the Edit players modal. In HVM the machine's chip is shown dimmed and is **not** interactive — only the human's chip opens the modal. The players bar is both the **turn indicator** and the entry point for changing players.
- **Status bar** — shows only the outcome message on game over (`"{name} wins!"` / `"It's a draw!"`). It carries no turn text and no "you are X" line; turn and symbol are conveyed by the players bar.
- **Board** — the 3×3 grid.
- **Actions** — "New game" and "Match history". There is no separate "Change players" button; the players bar replaces it.

---

## Modals

### Setup modal — "Who are we playing with?"

Shown on first load and after every completed game (new game flow).

- **HVM:** One name field ("Your name"), symbol selector (X or O).
- **HVH:** Two name fields ("Player 1 name", "Player 2 name"), symbol selector for Player 1 (Player 2 takes the other automatically).
- Mode selector (HVM / HVH) is part of this modal.
- Confirm is disabled until all required fields are non-empty.
- Changing mode preserves any names already typed: switching to HVH reveals the second name field (keeping whatever was entered before), and switching back to HVM hides it without discarding its value.

### Edit players modal — "Change players"

Accessible from the UI at any time (including mid-game, but triggering it mid-game resets the board).

- Same fields and validation as the setup modal for the current mode.
- Saving updates the displayed names going forward.
- Past match records are **not** altered — they store the name at the time of the match.

### Match history modal — "Match history"

Two views toggled by a tab or button group inside the modal:

**List view:** All matches in reverse chronological order. Each row shows date, players, result, and turn count.

**Leaderboard view:** One row per unique player name, sorted by wins descending. Columns: player name, wins, total games, win rate (%), average turns per win.

Both views are paginated at a maximum of 10 rows per page so the modal does not require vertical scrolling in the common case. Pagination controls (previous / next plus a "page X of Y" indicator) appear only when a view has more than one page. The page resets to the first page when switching tabs. Pagination is presentation-only; it does not change the underlying ordering (list is reverse-chronological, leaderboard is wins-descending).

A "Clear history" button deletes all records from localStorage after a confirmation prompt. Clearing cannot be undone.

---

## i18n Keys Required

```jsonc
// en.json
{
  "game.title": "Gato",

  "setup.titleHVM": "Who am I playing with?",
  "setup.titleHVH": "Who's playing?",
  "setup.playerName": "Your name",
  "setup.playerOneName": "Player 1 name",
  "setup.playerTwoName": "Player 2 name",
  "setup.chooseSymbol": "Choose your symbol",
  "setup.mode": "Game mode",
  "setup.modeHVM": "vs Machine",
  "setup.modeHVH": "vs Friend",
  "setup.confirm": "Let's play",

  "game.restart": "New game",
  "game.editPlayers": "Change players",
  "game.history": "Match history",
  "game.vs": "vs",

  "result.win": "{{name}} wins!",
  "result.lose": "{{name}} wins!",
  "result.draw": "It's a draw!",
  "result.turns": "{{count}} turns",
  "result.closeMeme": "Close",

  "history.title": "Match history",
  "history.tabList": "All matches",
  "history.tabLeaderboard": "Leaderboard",
  "history.empty": "No matches yet. Go play!",
  "history.clear": "Clear history",
  "history.clearConfirm": "Delete all match history? This cannot be undone.",
  "history.colDate": "Date",
  "history.colPlayers": "Players",
  "history.colResult": "Result",
  "history.colTurns": "Turns",
  "history.colWins": "Wins",
  "history.colGames": "Games",
  "history.colWinRate": "Win rate",
  "history.colAvgTurns": "Avg. turns",
  "history.draw": "Draw",
  "history.machine": "Machine",
  "history.prevPage": "Previous",
  "history.nextPage": "Next",
  "history.pageStatus": "Page {{current}} of {{total}}",

  "editPlayers.title": "Change players",
  "editPlayers.midGameWarning": "Changing players will reset the current game.",
  "editPlayers.confirm": "Save",
  "editPlayers.cancel": "Cancel",

  "nav.language": "Language",
  "nav.theme": "Theme",

  "error.invalidStorage": "Some saved data was invalid and has been reset.",
  "error.noMemes": "No meme images found for this category."
}
```

Spanish keys (`es.json`) must mirror the same key set exactly.

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

**Architecture:** Layer-based (default). Gato is a single-screen game with limited surface area; layer-based structure is sufficient.

---

## Environment Variables

### `infra/.env`

```
SUBDOMAIN=
DOMAIN_NAME=
HOSTED_ZONE_ID=
CERTIFICATE_ARN=
AWS_ACCOUNT_ID=
AWS_REGION=       # us-east-1
AWS_PROFILE=      # Optional
```

### `frontend/.env`

```
PUBLIC_SITE_URL=
```

---

## Gherkin Feature Specifications

> All scenarios must be defined here before Stage 2 (failing tests) begins. No scenario is added or modified after Stage 2 without developer authorization.

### Feature: Game setup

```gherkin
Feature: Game setup modal

  Scenario: Setup modal appears on first load
    Given the player opens the game for the first time
    Then the setup modal is displayed
    And the confirm button is disabled

  Scenario: Setup modal is skipped if name is already saved — HVM
    Given "gato_prefs" contains a valid playerOne name and mode HVM
    When the player opens the game
    Then the setup modal is not shown
    And the game starts in IDLE state with the saved name and preferences

  Scenario: Setup modal is skipped if both names are saved — HVH
    Given "gato_prefs" contains valid playerOne and playerTwo names and mode HVH
    When the player opens the game
    Then the setup modal is not shown
    And the game starts in IDLE state with the saved names and preferences

  Scenario: Setup modal appears if playerOne name is missing — HVM
    Given "gato_prefs" exists but playerOne name is empty or absent
    When the player opens the game
    Then the setup modal is displayed

  Scenario: Setup modal appears if either name is missing — HVH
    Given "gato_prefs" exists in HVH mode but playerTwo name is empty or absent
    When the player opens the game
    Then the setup modal is displayed

  Scenario: HVM setup — confirm requires a name
    Given the setup modal is open in HVM mode
    When the player leaves the name field empty
    Then the confirm button remains disabled
    When the player types a non-empty name
    Then the confirm button becomes enabled

  Scenario: HVH setup — confirm requires both names
    Given the setup modal is open in HVH mode
    When only Player 1 has entered a name
    Then the confirm button remains disabled
    When Player 2 also enters a name
    Then the confirm button becomes enabled

  Scenario: Symbol selection — opponent takes the other symbol
    Given the setup modal is open
    When the player selects "X"
    Then the opponent is assigned "O"
    When the player selects "O"
    Then the opponent is assigned "X"

  Scenario: Switching mode preserves typed names
    Given the player has typed a name in HVM mode
    When the player switches to HVH mode
    Then the entered name is still present in the Player 1 field

  Scenario: Player 2 field is prefilled with the last human Player 2 name
    Given a previous HVH match was set up with Player 2 "Luis"
    And the player is now in HVM mode in the modal
    When the player switches to HVH mode
    Then the Player 2 field is prefilled with "Luis"

  Scenario: Confirmed setup transitions to IDLE
    Given all required fields are filled
    When the player clicks confirm
    Then the modal closes
    And the game is in IDLE state
    And the board is empty
    And the player's name and symbol are displayed
```

### Feature: Core gameplay — Human vs Machine

```gherkin
Feature: Human vs Machine gameplay

  Background:
    Given the game is set up in HVM mode with player name "Jesús" playing as "X"
    And the game is in IDLE state

  Scenario: Human places first move
    When the human clicks an empty cell
    Then that cell shows "X"
    And the game transitions to PLAYING state
    And the turn count is 1

  Scenario: Machine responds after human move
    Given the game is in PLAYING state
    When the human places a valid move
    Then the machine places its move automatically
    And the machine's symbol appears in a cell

  Scenario: Human cannot play in an occupied cell
    Given cell 4 contains "X"
    When the human clicks cell 4
    Then the board does not change
    And it remains the human's turn

  Scenario: Human cannot play when it is the machine's turn
    Given the game is processing the machine's move
    When the human clicks any cell
    Then the board does not change

  Scenario: Human wins
    Given the board is one move away from a human win on row [0,1,2]
    When the human places the winning move
    Then the game transitions to GAME_OVER
    And the winning line is highlighted
    And the result message shows "Jesús wins!"
    And a meme from the "win" category is displayed
    And the match is recorded in localStorage

  Scenario: Machine wins
    Given the board is one move away from a machine win
    When the machine places the winning move
    Then the game transitions to GAME_OVER
    And the winning line is highlighted
    And the result message shows the machine wins
    And a meme from the "lose" category is displayed
    And the match is recorded in localStorage

  Scenario: Draw
    Given all cells are filled with no winner
    Then the game transitions to GAME_OVER
    And the result message shows "It's a draw!"
    And a meme from the "neutral" category is displayed
    And the match is recorded in localStorage
```

### Feature: Core gameplay — Human vs Human

```gherkin
Feature: Human vs Human gameplay

  Background:
    Given the game is set up in HVH mode with Player 1 "Ana" as "X" and Player 2 "Luis" as "O"
    And the game is in IDLE state

  Scenario: Player 1 goes first
    When Player 1 clicks an empty cell
    Then that cell shows "X"
    And the players bar highlights "Luis" as the active player

  Scenario: Players alternate turns
    Given it is Player 2's turn
    When Player 2 clicks an empty cell
    Then that cell shows "O"
    And the players bar highlights "Ana" as the active player

  Scenario: Player 1 wins in HVH
    Given the board is one move away from a Player 1 win
    When Player 1 places the winning move
    Then the game transitions to GAME_OVER
    And the result message shows "Ana wins!"
    And a meme from the "neutral" category is displayed
    And the match is recorded in localStorage

  Scenario: Draw in HVH
    Given all cells are filled with no winner
    Then a meme from the "neutral" category is displayed
```

### Feature: Meme overlay

```gherkin
Feature: Meme overlay on game over

  Scenario: Meme appears at game over
    Given the game transitions to GAME_OVER
    Then a meme image is displayed overlaid on the board
    And a close button is visible

  Scenario: Close meme with button
    Given the meme overlay is visible
    When the player clicks the close button
    Then the meme overlay is hidden
    And the game result remains visible

  Scenario: Close meme with ESC key
    Given the meme overlay is visible
    When the player presses ESC
    Then the meme overlay is hidden

  Scenario: Meme category matches outcome — human wins HVM
    Given the game ended with the human winning in HVM mode
    Then the meme image is selected from the "win" folder

  Scenario: Meme category matches outcome — machine wins HVM
    Given the game ended with the machine winning in HVM mode
    Then the meme image is selected from the "lose" folder

  Scenario: Meme category matches outcome — draw HVM
    Given the game ended in a draw in HVM mode
    Then the meme image is selected from the "neutral" folder

  Scenario: Meme category matches outcome — any HVH result
    Given the game ended in HVH mode regardless of result
    Then the meme image is selected from the "neutral" folder

  Scenario: No meme images available for category
    Given the meme catalog for the resolved category is empty
    Then no meme is displayed
    And a non-blocking error message is shown
```

### Feature: Match history

```gherkin
Feature: Match history modal

  Scenario: History modal opens
    Given at least one match has been played
    When the player opens the history modal
    Then all matches are listed in reverse chronological order
    And each row shows date, players, result, and turn count

  Scenario: Empty history state
    Given no matches have been played
    When the player opens the history modal
    Then an empty state message is displayed

  Scenario: Leaderboard view
    When the player switches to the leaderboard tab
    Then each unique player name appears once
    And rows are sorted by wins descending
    And each row shows wins, total games, win rate, and average turns per win

  Scenario: Draw does not count as a win for any player
    Given a match ended in a draw
    When the player views the leaderboard
    Then neither player's win count increases

  Scenario: Clear history requires confirmation
    Given at least one match exists
    When the player clicks "Clear history"
    Then a confirmation prompt is shown
    And history is not deleted yet

  Scenario: Clear history confirmed
    Given the confirmation prompt is visible
    When the player confirms
    Then all match records are deleted from localStorage
    And the empty state message is shown

  Scenario: Clear history cancelled
    Given the confirmation prompt is visible
    When the player cancels
    Then the match records remain unchanged

  Scenario: Long history is paginated
    Given more than 10 matches exist
    When the player opens the history modal
    Then at most 10 rows are shown per page
    And pagination controls indicate the current and total page count
    And advancing to the next page shows the following rows

  Scenario: Pagination resets when switching views
    Given the player is on a later page of the list view
    When the player switches to the leaderboard tab
    Then the leaderboard view starts on its first page
```

### Feature: Edit players

```gherkin
Feature: Edit players modal

  Scenario: Edit players modal opens
    When the player clicks "Change players"
    Then the edit players modal opens
    And the current name(s) are pre-filled

  Scenario: Edit mid-game shows warning
    Given the game is in PLAYING state
    When the player opens the edit players modal
    Then a warning is displayed that the current game will be reset

  Scenario: Saving new names updates the display
    Given the edit players modal is open
    When the player changes their name and saves
    Then the displayed name updates immediately
    And past match records retain the original name

  Scenario: Cancel edit restores original names
    Given the edit players modal is open with name "Jesús"
    When the player clears the field and clicks cancel
    Then the name remains "Jesús"
    And no game state changes
```

### Feature: New game flow

```gherkin
Feature: Starting a new game after game over

  Scenario: New game starts immediately when players are registered
    Given the game is in GAME_OVER state
    And the current players are registered
    When the player clicks "New game"
    Then the board is cleared
    And the game returns to IDLE state with the same players
    And the setup modal is not shown

  Scenario: New game opens setup when players are not registered
    Given the game is in GAME_OVER state
    And no players are registered
    When the player clicks "New game"
    Then the setup modal opens
    And the game returns to SETUP state
```

To change names or mode between games, the player clicks a chip in the players bar, which opens the edit modal explicitly.

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
    And the preference is stored in localStorage under "gato_prefs"

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
    And the preference is stored in localStorage under "gato_prefs"

  Scenario: Stored language persists on reload
    Given the user previously selected Spanish
    When the page reloads
    Then Spanish is used
```

### Feature: Security — input validation

```gherkin
Feature: Input validation and security

  Scenario: Script injection in player name is blocked
    When the player submits "<script>alert(1)</script>" as their name
    Then the input is rejected with a visible error
    And no script is executed

  Scenario: Excessively long player name is rejected
    When the player submits a name longer than 30 characters
    Then the input is rejected with a visible error

  Scenario: Invalid localStorage data is reset
    Given corrupted data exists in "gato_prefs" or "gato_history"
    When the page loads
    Then the corrupted key is reset to its default value
    And a visible warning is shown

  Scenario: Tampered match history entry is discarded
    Given "gato_history" contains a record with an invalid shape
    When the page loads
    Then the invalid record is discarded
    And valid records are preserved
```

---

## Unit Test Definitions

> Tests are defined here before implementation. No test is written without a definition here. No definition is added or modified after Stage 2 without developer authorization.

### Game engine — board logic (pure functions)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-ENG-01` | Initial board has 9 null cells | `createInitialBoard()` | Array of 9 `null` values |
| `T-ENG-02` | Place move on empty cell returns new board | `placeMove(board, 4, 'X')` | Board with `'X'` at index 4 |
| `T-ENG-03` | Place move on occupied cell returns null | `placeMove(board, 4, 'X')` when cell 4 is `'O'` | `null` |
| `T-ENG-04` | Detect row win | Board with `['X','X','X', null,...]` | `{ winner: 'X', line: [0,1,2] }` |
| `T-ENG-05` | Detect column win | Board with X at 0, 3, 6 | `{ winner: 'X', line: [0,3,6] }` |
| `T-ENG-06` | Detect diagonal win | Board with X at 2, 4, 6 | `{ winner: 'X', line: [2,4,6] }` |
| `T-ENG-07` | Detect draw — full board no winner | Full board with no winning line | `{ winner: 'DRAW', line: null }` |
| `T-ENG-08` | No result on incomplete board | Board with 4 moves, no win | `null` |
| `T-ENG-09` | `getAvailableCells` returns empty cell indices | Board with cells 0,1,2 filled | `[3,4,5,6,7,8]` |
| `T-ENG-10` | `getAvailableCells` on full board returns empty array | Full board | `[]` |

### Machine (minimax)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-AI-01` | Machine blocks an immediate human win | Board where human wins if cell 4 is not taken | Machine plays cell 4 |
| `T-AI-02` | Machine takes winning move when available | Board where machine wins if cell 0 is played | Machine plays cell 0 |
| `T-AI-03` | Machine never loses on empty board | Any empty board, machine plays `O` | Game result is never `{ winner: 'X' }` across all possible human responses |
| `T-AI-04` | `getBestMove` returns a valid cell index | Any non-terminal board | Integer between 0 and 8 that is currently `null` |

### Game state transitions

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-ST-01` | SETUP → IDLE on confirm | `confirmSetup(validSetup)` | State with `status: IDLE`, empty board, `turnCount: 0` |
| `T-ST-02` | IDLE → PLAYING on first move | `applyMove(IDLE_STATE, 0)` | State with `status: PLAYING`, cell 0 filled, `turnCount: 1` |
| `T-ST-03` | PLAYING → GAME_OVER on win | State one move from win, `applyMove(state, winningCell)` | State with `status: GAME_OVER`, `winner` set, `winningLine` set |
| `T-ST-04` | PLAYING → GAME_OVER on draw | State with 8 moves, one empty cell, no winner possible | State with `status: GAME_OVER`, `winner: 'DRAW'` |
| `T-ST-05` | GAME_OVER → SETUP on new game | `startNewGame(GAME_OVER_STATE)` | State with `status: SETUP`, empty board |
| `T-ST-06` | Move rejected in GAME_OVER state | `applyMove(GAME_OVER_STATE, 0)` | Returns unchanged state |

### Match history

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-HIST-01` | `buildMatchRecord` produces a valid record | Completed `GameState` | Record with all required fields, valid ISO date |
| `T-HIST-02` | Winner name resolved correctly for human win | `winner: 'X'`, `humanSymbol: 'X'`, `playerOne: 'Jesús'` | `winnerName: 'Jesús'` |
| `T-HIST-03` | Winner name resolved correctly for machine win | `winner: 'O'`, `humanSymbol: 'X'` in HVM | `winnerName: 'Machine'` (i18n key resolved) |
| `T-HIST-04` | Winner name for draw uses i18n key | `winner: 'DRAW'` | `winnerName` matches i18n draw key |
| `T-HIST-05` | `buildLeaderboard` aggregates wins per player | 3 records with mixed results | Correct win counts, sorted descending |
| `T-HIST-06` | Draw increments games but not wins | Record with `winner: 'DRAW'` | Neither player's win count incremented |
| `T-HIST-07` | `buildLeaderboard` computes average turns per win | 2 wins with turn counts 5 and 7 | Average turns = 6 |

### Meme loader

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-MEME-01` | `getMemeCategory` returns `win` for human win in HVM | `{ winner: 'X', humanSymbol: 'X', mode: HVM }` | `'win'` |
| `T-MEME-02` | `getMemeCategory` returns `lose` for machine win in HVM | `{ winner: 'O', humanSymbol: 'X', mode: HVM }` | `'lose'` |
| `T-MEME-03` | `getMemeCategory` returns `neutral` for draw in HVM | `{ winner: 'DRAW', mode: HVM }` | `'neutral'` |
| `T-MEME-04` | `getMemeCategory` returns `neutral` for any HVH result | `{ winner: 'X', mode: HVH }` | `'neutral'` |
| `T-MEME-05` | `pickRandomMeme` returns a filename from the catalog | `catalog.win = ['a.jpg', 'b.jpg']`, category `win` | Either `'a.jpg'` or `'b.jpg'` |
| `T-MEME-06` | `pickRandomMeme` returns null for empty category | `catalog.win = []`, category `win` | `null` |

### Player name validation

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-NAME-01` | Valid name passes | `"Jesús"` | Returns trimmed name |
| `T-NAME-02` | Empty name fails | `""` | Returns error result |
| `T-NAME-03` | Whitespace-only name fails | `"   "` | Returns error result |
| `T-NAME-04` | Name exceeding 30 characters fails | 31-character string | Returns error result |
| `T-NAME-05` | Script tag in name fails | `"<script>alert(1)</script>"` | Returns error result |

### localStorage validation

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-LS-01` | Valid `gato_prefs` passes | `{ language: "en", theme: "dark" }` | Returns parsed object |
| `T-LS-02` | Invalid theme value fails | `{ language: "en", theme: "blue" }` | Returns error result |
| `T-LS-03` | Invalid language value fails | `{ language: "fr", theme: "dark" }` | Returns error result |
| `T-LS-04` | Tampered JSON resets to default | `"{{not json}}"` | Returns error result, default applied |
| `T-LS-05` | Valid `gato_history` array passes | Array of valid `MatchRecord` objects | Returns parsed array |
| `T-LS-06` | Record with missing field is discarded | Array where one record lacks `id` | Valid records preserved, invalid discarded |
| `T-LS-07` | Non-array `gato_history` fails | `"not an array"` | Returns error result |

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

- `infra/bin/app.ts` consuming `GameStack` from `@arcade/infra`
- `infra/.env.example` with all required variables
- `infra/cdk.json` configured
- `infra/readme.md` with deploy instructions

**Validation:** `npx tsc --noEmit` passes. Developer runs `cdk deploy` from local and confirms the subdomain resolves.

---

### Stage 2 — Failing tests

**Scope:** Write all unit tests defined in this spec. All tests must fail (no implementation exists).

**Files created:**

- `frontend/src/lib/engine/__tests__/board.test.ts` — T-ENG-*
- `frontend/src/lib/engine/__tests__/minimax.test.ts` — T-AI-*
- `frontend/src/lib/state/__tests__/transitions.test.ts` — T-ST-*
- `frontend/src/lib/history/__tests__/history.test.ts` — T-HIST-*
- `frontend/src/lib/memes/__tests__/memes.test.ts` — T-MEME-*
- `frontend/src/lib/validation/__tests__/playerName.test.ts` — T-NAME-*
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

1. Constants and enums (`GameStatus`, `GameMode`, `Symbol`, `MemeCategory`, `Theme`, `Language`, `WINNING_LINES`, storage keys, name validation limits)
2. i18n setup — i18next config, `en.json`, `es.json`
3. localStorage validation layer (`gato_prefs`, `gato_history`)
4. Player name validation
5. Board engine — pure functions (`createInitialBoard`, `placeMove`, `checkResult`, `getAvailableCells`)
6. Minimax — `getBestMove` pure function
7. State transitions — `confirmSetup`, `applyMove`, `startNewGame`
8. Match history — `buildMatchRecord`, `buildLeaderboard`
9. Meme loader — `getMemeCategory`, `pickRandomMeme`
10. React components:
    - `Board` — renders 3×3 grid, highlights winning line
    - `Cell` — single cell, handles click
    - `SetupModal` — name(s), symbol, mode selection
    - `EditPlayersModal` — name change, mid-game warning
    - `HistoryModal` — list + leaderboard tabs, clear action
    - `MemeOverlay` — image display, close via button or ESC
    - `PlayersBar` — player chips (symbol + name), turn highlight, opens edit modal
    - `StatusBar` — outcome message on game over
    - `ThemeToggle`, `LanguageToggle`
11. Astro page and layout — single page, all components wired
12. CSS — informal aesthetic, CSS custom properties for both themes, responsive

**After each sub-step, run `vitest`. Proceed only when all tests covering that sub-step pass.**

---

### Stage 4 — Documentation

**Scope:** Complete all documentation. No code changes.

**Deliverables:**

- `gato/spec.md` — finalize decisions log
- `gato/claude.md` — game-specific Claude Code instructions
- `gato/readme.md` — local dev setup, test, and deploy instructions

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-24 | Minimax for machine difficulty — no configurable level | Gato is a simple game; an optimal opponent is the right default; difficulty settings add scope without adding game depth |
| 2026-06-24 | Board as a flat 9-cell array | Simpler to index, pass, and test than a 2D array; winning lines are constant indices, so 2D offers no advantage |
| 2026-06-24 | Match records store names at time of match | Names are mutable (edit players modal) but history is immutable; storing the name snapshot preserves an accurate record without requiring player IDs or a database |
| 2026-06-24 | Meme catalog as a static JSON manifest, not filesystem scan | The frontend cannot scan `public/` at runtime in the browser; a manifest maintained by the developer decouples image management from application logic; Claude Code creates the structure and loader, the developer populates the images and manifest |
| 2026-06-24 | Meme category `neutral` covers both HVH results and draws in HVM | HVH has no "machine to mock or celebrate against"; draws have no clear winner; a single neutral category simplifies the catalog and avoids over-engineering for a lighthearted feature |
| 2026-06-24 | New game flow returns to SETUP (not IDLE) | Players may want to change names or mode between games; reopening the setup modal is the natural entry point and avoids a stale state where the board resets but names are unchanged |
| 2026-06-25 | **Superseded:** "New game" starts a fresh IDLE game with the same players when they are registered; it only opens the setup modal when no players are registered | Reopening the modal on every new game added friction to rematches; players are already known after a game, so a rematch should start immediately. Changing names or mode is still available on demand via the "Change players" button. The pure `startNewGame` transition still returns SETUP (and `T-ST-05` is unchanged); the state layer composes it with `confirmSetup` to decide IDLE vs SETUP |
| 2026-06-24 | Player name max length: 30 characters | Long enough for any real name; prevents UI overflow on small screens without adding complex truncation logic |
| 2026-06-24 | Tampered or invalid history records are discarded individually, not wholesale | A single corrupt record should not erase an entire history; partial recovery is more user-friendly and keeps valid data intact |
| 2026-06-24 | Layer-based frontend architecture | Single-screen game with limited surface area; layer-based structure (`engine/`, `state/`, `validation/`) is sufficient and simpler to navigate at this scope |
| 2026-06-24 | `gato_prefs` stores player setup (names, mode, symbol) in addition to UI preferences | Allows the setup modal to be skipped on subsequent visits when required names are already present; names are mutable so the edit players modal is always available; storing them in `gato_prefs` keeps all non-history persistence in one key |
| 2026-06-24 | Validation functions return a discriminated result `{ ok: true; value } \| { ok: false; error }` | The spec only said "returns parsed object / error result"; this shape makes success/failure explicit and type-narrowable, and is fixed by the Stage 2 tests. Chosen during Stage 2 |
| 2026-06-24 | `winnerName` for a draw stores the i18n key `history.draw` (not a resolved string) | The spec said "i18n key for draw" without naming it; `history.draw` is reused by the history view, so the record stays language-agnostic and renders correctly under either language |
| 2026-06-24 | Leaderboard row shape is `{ name, wins, games, winRate, avgTurns }` | Derived from the history view columns; the field names are fixed here (and by the Stage 2 tests) so the engine and UI share one contract |
| 2026-06-24 | `MemeCategory` is a string-literal union (`'win' \| 'lose' \| 'neutral'`), not a TS `enum` | The category values double as the `public/memes/<category>/` folder names and as catalog keys; a literal union keeps comparisons and indexing direct without enum-to-string mapping |
| 2026-06-25 | History modal paginates both views at 10 rows/page; slicing lives in the `HistoryModal` component, not the history logic layer | Pagination is a presentation concern that does not alter ordering or stored data, so it stays in the UI; keeping it out of `history.ts` avoids touching the locked Stage 2 `T-HIST-*` contract. Page size 10 keeps the modal scroll-free in the common case |
| 2026-06-25 | **Supersedes** "Changing mode resets the form fields": switching mode now preserves names already typed | Re-typing a name after a mode switch is friction; the name is the same person regardless of mode. Player 1's name carries over, and Player 2's value is retained (just hidden) when toggling back to HVM, so no input is lost |
| 2026-06-25 | Meme catalog lives in `src/lib/memes/catalog.json` (imported by the loader), generated by an `npm run gen:memes` script that scans `public/memes/` | Realizes the existing "static JSON manifest" decision (the catalog had drifted into a TS constant in `constants/memes.ts`). A JSON file separates developer-owned data from code, and a scan script removes manual list maintenance. `MEME_BASE_PATH` stays a constant; only the per-category filename lists move to JSON. The locked `T-MEME-*` tests are unaffected since they pass the catalog as an argument |
| 2026-06-25 | `gato_prefs` gains `lastHumanPlayerTwo`, the last human Player 2 name, used to prefill the Player 2 field when switching to HVH | In HVM `playerTwo` is the machine label, so it cannot prefill a human field. A dedicated remembered value (updated only on HVH setups) lets the modal restore the last real opponent name. It is optional and additive; `validatePrefs` stays backward-compatible and the locked `T-LS-*` tests are unaffected |
| 2026-06-25 | A `PlayersBar` of clickable chips becomes the turn indicator and the entry point to the edit modal; `StatusBar` is reduced to the game-over outcome message; the standalone "Change players" button and the `game.turn` / `game.youAre` strings are removed | Makes both players' identities permanently visible (the goal of the feature) and folds turn indication into the same element, removing the redundancy of showing a name both in a chip and in a turn sentence. The chip shows symbol + name, so the "you are X" line is also redundant. In HVM the machine is not editable, so its chip is dimmed and inert |