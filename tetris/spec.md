# Tetris — Game Spec

> This document is the source of truth for Claude Code on this game. It inherits the full contract defined in the monorepo [`spec.md`](../spec.md). Read both documents fully before acting on any prompt. In case of conflict, the monorepo `spec.md` takes precedence **unless** a deviation is explicitly declared in the Deviations section below.

---

## Game Overview

`tetris` is a classic single-player Tetris built to modern-guideline rules with a neon dark aesthetic. Tetriminos fall on a 10×20 playfield; the player moves, rotates (Super Rotation System with wall kicks), soft-drops, hard-drops, and holds pieces to complete horizontal lines. The game has **15 levels** with a variable line goal and increasing fall speed, full **T-Spin / Back-to-Back / Combo / Perfect Clear** scoring, a **hold** slot capped at 10 uses per game, a **5-piece next queue**, a **ghost piece**, and a **7-bag** randomizer. It is bilingual (English / Spanish), sound-enabled (with a mute toggle), and keeps a **local match history** (last 50 games, paginated) plus an all-time best score. There is no backend; all persistence is `localStorage`.

The visual design is a fixed **dark-only** neon layout (see `Design & Layout` below); there is no light/dark theme toggle.

**Subdomain:** Configured via `SUBDOMAIN` in `infra/.env` (`tetris`)
**Folder:** `tetris/`
**Backend required:** No

---

## Deviations from Monorepo Contract

Each deviation below was confirmed by the developer before implementation.

1. **Dark-only, no theme toggle.** The template ships a light/dark theme with a `ThemeToggle` and a `theme` preference. Tetris renders a single fixed dark design (design mandate: "no hay tema claro/oscuro, solo este diseño respetado al 100%"). Consequences: no `ThemeToggle` component, no `theme` key in `tetris_prefs`, no light-theme CSS variables, and the `Feature: Theme` scenarios and `T-LS` theme cases from the template are removed. The language toggle is retained.
2. **Self-hosted fonts.** The design uses Google Fonts (`Orbitron`, `Space Grotesk`) loaded from `fonts.googleapis.com`. The security/CSP contract forbids external resources, so both fonts are self-hosted under `frontend/public/fonts/` and referenced via local `@font-face`. No CDN links. System-font fallbacks are declared.

---

## Design & Layout

Recreated pixel-faithfully from the design reference committed at [`design/Tetris.dc.html`](design/Tetris.dc.html) (Claude Design handoff; see [`design/readme.md`](design/readme.md) for provenance and the reference screenshot). Single dark canvas, radial background `radial-gradient(ellipse at 50% -10%, #1a2140 0%, #0a0d16 55%, #05060a 100%)`, faint animated scanline overlay (`opacity ~0.035`, disabled under `prefers-reduced-motion`).

> **All word labels are i18n, never hardcoded.** The mock renders its labels in Spanish (`NIVEL`, `LINEAS`, `RESTANTES`, `SIGUIENTES`, `PAUSA`, `CAER`, …) simply because it was authored in Spanish. In the real build every visible string resolves through i18next (§ i18n Keys Required) with matching `en`/`es` values. The panels and buttons below are therefore named by **role + i18n key**, not by the mock's literal text. Non-text glyphs (`◀ ⟳ ▶ ▼ ⤓ ⟲`) are literal icons, not translatable strings.

- **Header:** the game title (`game.title`) as an Orbitron wordmark (neon cyan `#4de8ff` with glow), a current-level readout (`hud.level`), and a pause/resume toggle button.
- **Left column (236px):** the hold panel (`hud.hold`; cyan border `#4de8ff`, 4×4 mini-grid, "to hold" remaining counter `hud.toHold`) and a stats panel (magenta border `#c04dff`) showing level (`hud.level`), score (`hud.score`), lines cleared (`hud.lines`), and remaining lines to the next goal (`hud.remaining`).
- **Center:** the 10×20 playfield (cyan border, 26px cells, 2px gaps, rounded 4px cells with per-piece glow). Pause and game-over overlays render inside this frame.
- **Right column (200px):** the next-queue panel (`hud.next`; pink border `#ff4d8f`) showing **5** upcoming pieces.
- **Bottom bar:** touch controls — move left `◀`, rotate `⟳`, move right `▶`, soft drop `▼`, hold (`controls.hold`), and hard drop (`⤓` glyph + `controls.hardDrop`). A **rotate-counterclockwise button `⟲` is added** (design shows only one rotate button; the game needs both directions).

The 1440×900 design is the desktop reference. The layout is **responsive**: on narrow/mobile viewports (`max-width: 900px`) the three columns reflow into a single compact row above the board — HOLD, the stats panel (level omitted; it stays in the header), and NEXT (showing only the immediate next piece instead of 5) sit side by side — followed by the full-width board and then the touch control bar, so the whole game fits one screen without scrolling. The pause/resume toggle moves from the header (crowded and easy to miss at this width) into the touch control bar, next to hold/hard-drop. Exact breakpoints and compaction details are an implementation detail; the desktop composition above is authoritative for wide screens.

### Piece palette (single source of truth: `constants/pieces.ts`)

| Piece | Main | Glow |
|---|---|---|
| I | `#37e0e0` | `rgba(55,224,224,0.65)` |
| O | `#e8d84a` | `rgba(232,216,74,0.65)` |
| T | `#b355f2` | `rgba(179,85,242,0.65)` |
| S | `#3fd66b` | `rgba(63,214,107,0.65)` |
| Z | `#f2455a` | `rgba(242,69,90,0.65)` |
| J | `#3d6bf2` | `rgba(61,107,242,0.65)` |
| L | `#f2954a` | `rgba(242,149,74,0.65)` |

Empty cell `#12161f`; ghost piece = the piece's main color at reduced opacity (translucent outline), no glow.

---

## Game Rules

### Playfield

- **10 columns × 20 visible rows.** Internally the grid includes **at least 2 hidden spawn/buffer rows above** the visible area; wall kicks may momentarily place cells there. Only the 20 visible rows are rendered.
- Cell origin is top-left; row 0 is the top visible row. Positive `y` is **downward** for piece position; the SRS kick tables below use their own `y`-up convention, stated where they appear.

### Tetriminos & rotation states

- Seven pieces: `I, O, T, S, Z, J, L`. Each has four rotation states: `0` (spawn), `R` (one clockwise turn), `2` (180°), `L` (one counterclockwise turn).
- Piece geometry and spawn orientation follow the **Super Rotation System (SRS)**. Spawn position: pieces appear horizontally centered in the top spawn rows (`I` and `O` span columns 3–6 conventions per SRS). `O` never changes cell footprint on rotation.
- Rotation is available **clockwise and counterclockwise**.

### Super Rotation System (SRS) wall kicks

On a rotation, the engine tries 5 candidate offsets in order; the first that lands in a legal position (no overlap, in bounds) is applied. If none fit, the rotation is rejected. Offsets are `(dx, dy)` with `dx` = columns right, **`dy` positive = up** (classic SRS convention). These live in `constants/srs.ts`.

**J, L, S, T, Z** kick table:

| Transition | Offsets |
|---|---|
| `0→R` | (0,0) (−1,0) (−1,+1) (0,−2) (−1,−2) |
| `R→0` | (0,0) (+1,0) (+1,−1) (0,+2) (+1,+2) |
| `R→2` | (0,0) (+1,0) (+1,−1) (0,+2) (+1,+2) |
| `2→R` | (0,0) (−1,0) (−1,+1) (0,−2) (−1,−2) |
| `2→L` | (0,0) (+1,0) (+1,+1) (0,−2) (+1,−2) |
| `L→2` | (0,0) (−1,0) (−1,−1) (0,+2) (−1,+2) |
| `L→0` | (0,0) (−1,0) (−1,−1) (0,+2) (−1,+2) |
| `0→L` | (0,0) (+1,0) (+1,+1) (0,−2) (+1,−2) |

**I** kick table:

| Transition | Offsets |
|---|---|
| `0→R` | (0,0) (−2,0) (+1,0) (−2,−1) (+1,+2) |
| `R→0` | (0,0) (+2,0) (−1,0) (+2,+1) (−1,−2) |
| `R→2` | (0,0) (−1,0) (+2,0) (−1,+2) (+2,−1) |
| `2→R` | (0,0) (+1,0) (−2,0) (+1,−2) (−2,+1) |
| `2→L` | (0,0) (+2,0) (−1,0) (+2,+1) (−1,−2) |
| `L→2` | (0,0) (−2,0) (+1,0) (−2,−1) (+1,+2) |
| `L→0` | (0,0) (+1,0) (−2,0) (+1,−2) (−2,+1) |
| `0→L` | (0,0) (−1,0) (+2,0) (−1,+2) (+2,−1) |

`O` has no kicks (rotation is a no-op on its footprint).

### Randomizer

**7-bag:** each bag is a shuffled permutation of all seven pieces; the next bag is generated only when the current one is exhausted. The next queue always shows the upcoming **5** pieces. Shuffling uses `Math.random` (Fisher–Yates); the randomizer is isolated so it can later be seeded (see Future Considerations).

### Gravity & drops

- **Gravity per level** (seconds for the piece to fall one row), single source of truth `constants/levels.ts`:

  | Level | s/row | | Level | s/row |
  |---|---|---|---|---|
  | 1 | 1.000 | | 9 | 0.094 |
  | 2 | 0.793 | | 10 | 0.064 |
  | 3 | 0.618 | | 11 | 0.043 |
  | 4 | 0.473 | | 12 | 0.028 |
  | 5 | 0.355 | | 13 | 0.018 |
  | 6 | 0.262 | | 14 | 0.011 |
  | 7 | 0.190 | | 15 | 0.007 |
  | 8 | 0.135 | | | |

- **Soft drop:** while held, the piece falls at `SOFT_DROP_FACTOR × gravity(level)` (factor `20`), never slower than normal gravity. Scores **1 × cells** descended by soft drop.
- **Hard drop:** the piece teleports to its landing row and **locks immediately** (effective rate 0.0001 s/row). Scores **2 × cells** traversed.
- **DAS / ARR** (held horizontal movement): `DAS = 170 ms` initial delay, `ARR = 50 ms` repeat. Constants in `constants/input.ts`.

### Lock delay

When a piece rests on the stack (cannot move down), a **lock delay of `LOCK_DELAY_MS = 500`** starts. A successful move or rotation **resets** the timer, up to **`MAX_LOCK_RESETS = 15`** resets; after that the piece force-locks on the next surface contact. When the timer expires (or on hard drop), the piece locks into the board. The engine is `dt`-driven; the timer is advanced by injected `dt`, never read from a clock inside the pure layer.

### Hold

- Pressing hold moves the active piece into the hold slot. If the slot is empty, the next piece is pulled from the queue; if occupied, the held and active pieces **swap**, and the swapped-in piece spawns at the top in its spawn orientation.
- **You cannot hold twice in a row** until the current piece locks (standard rule).
- **Global cap: `MAX_HOLDS = 10` uses per game.** Each successful hold decrements a remaining counter (the "to hold" readout, `hud.toHold`). At `0`, hold is disabled for the rest of the run.

### Ghost piece

A translucent projection of the active piece is drawn at its hard-drop landing position (same color, reduced opacity, no glow). It updates on every horizontal move / rotation.

### Line clears & gravity collapse

When one or more rows become completely filled after a piece locks, those rows are removed and all rows above shift down. Multiple simultaneous rows clear together (up to 4 = a Tetris).

### T-Spin detection

Evaluated only when the **last successful action before lock was a rotation** of the `T` piece:

- **3-corner rule:** consider the four diagonal corners of the T's 3×3 bounding box. If **≥ 3** corners are occupied (by blocks or walls/floor), it is a T-Spin.
- **Mini vs full:** a T-Spin is a **Mini T-Spin** when fewer than two of the T's two **front** corners (the two on the side the T points away from its flat edge) are filled — i.e. the two "pointing" corners are not both occupied — **unless** the rotation used the last (index-4) wall-kick offset, which always upgrades to a full T-Spin. Otherwise it is a full **T-Spin**.
- The result (`none | mini | full`) combines with how many lines cleared to select the scoring/credit row.

### Scoring (points)

`Action Total` values below are multiplied by the **current level**. Single source of truth: `constants/scoring.ts`.

| Action | Points (× level) |
|---|---|
| Single | 100 |
| Double | 300 |
| Triple | 500 |
| Tetris | 800 |
| Mini T-Spin (no clear) | 100 |
| Mini T-Spin Single | 200 |
| T-Spin (no clear) | 400 |
| T-Spin Single | 800 |
| T-Spin Double | 1200 |
| T-Spin Triple | 1600 |
| Soft drop | 1 × cells (not × level) |
| Hard drop | 2 × cells (not × level) |
| Combo | 50 × combo × level |
| Perfect Clear — Single | 800 × level |
| Perfect Clear — Double | 1200 × level |
| Perfect Clear — Triple | 1800 × level |
| Perfect Clear — Tetris | 2000 × level |
| Perfect Clear — B2B Tetris | 3200 × level |

> **Combo / Perfect Clear values** use the standard Tetris Guideline. They are parameterized in `constants/scoring.ts` and may be tuned. These add **points only** — they do **not** contribute to the level line-credit goal.

- **Back-to-Back (points):** when consecutive line clears are all *difficult* (Tetris, any T-Spin line clear, any Mini T-Spin line clear), each qualifying clear after the first adds **0.5 × its Action Total** on top. A non-difficult line clear breaks the chain; a move that clears no line does not break it.
- **Combo counter:** increments on each consecutive piece that clears ≥ 1 line; resets to none when a piece locks without clearing a line.

### Level progression (line-credit system)

Progression is measured in **credited lines** toward the current level's goal, *not* raw lines cleared. Special actions grant more credit than their physical line count.

**Line-credit table** (single source of truth `constants/scoring.ts`; `Back-to-Back` adds `0.5 ×` the action's own credited value):

| Action | Credited lines |
|---|---|
| Single / Mini T-Spin (no clear) | 1 |
| Mini T-Spin Single | 2 |
| Double | 3 |
| T-Spin (no clear) | 4 |
| Triple | 5 |
| Tetris / T-Spin Single | 8 |
| T-Spin Double | 12 |
| T-Spin Triple | 16 |
| Back-to-Back bonus | + 0.5 × the action's credited value |

Credited lines accumulate as a rational number (B2B can produce halves); comparisons against the goal use the exact value; the remaining-lines readout (`hud.remaining`) shows `ceil`/`floor` of remaining as appropriate (display detail).

**Goal formula.** For a run started at level `N`:

- The **starting level `N`** goal is the *cumulative* requirement `5 · N · (N+1) / 2` credited lines (e.g. start at 1 → 5, start at 3 → 30).
- Every **subsequent level `L > N`** requires `5 · L` credited lines.
- When the accumulated credit reaches the current level's goal, the level increments (adopting that level's gravity and characteristics) and the credit counter continues toward the next goal.
- Completing **level 15** always corresponds to a cumulative **600** credited lines regardless of `N` (worked example: start 3 → 30 + 20 + 25 + … + 75 = 600).

### Starting level selection

From the `IDLE` (start) screen the player picks a starting level **1–15**. The run begins at that level's gravity and characteristics and uses the goal formula above. The choice is persisted (`startLevel` in `tetris_prefs`) and pre-selected next time.

### Win / lose

- **Victory:** completing level 15 (accumulated credit ≥ 600) → `VICTORY`. The run is recorded and a congratulation is shown.
- **Game over:** *block out* — a newly spawned piece overlaps existing blocks — or *lock out* — a piece locks entirely within the hidden buffer above the visible field. Either → `GAME_OVER`. The run is recorded.

---

## Match history & scoreboard

Stored in `localStorage` under `tetris_scores`. A dedicated scoreboard view lists past runs.

Per-run record fields:

| Field | Meaning |
|---|---|
| `id` | Unique id |
| `date` | ISO timestamp of run end |
| `startLevel` | Level the run began at |
| `endLevel` | Level reached when the run ended |
| `linesCleared` | Physical lines cleared |
| `score` | Final score |
| `regularPoints` | Points from regular line clears + soft/hard drop |
| `bonusPoints` | Points from bonuses (T-Spin, B2B, Combo, Perfect Clear) |
| `durationMs` | Elapsed play time (paused time excluded) |
| `outcome` | `GAME_OVER` \| `VICTORY` |

Rules:

- **Cap 50 records**, most recent first, **10 per page** (pagination).
- The **all-time best** (highest `score`) is stored separately (`best`) and **is never pruned**, even when it falls outside the newest 50.
- **Clear history** action requires a **confirmation dialog**; confirming removes all records and the stored best.

---

## Controls

A **controls help modal** documents the full mapping. Rendered outside the game FSM like the pause overlay. It is reachable from the header **?** icon and the start screen only while `IDLE` (and, harmlessly, from the header while `GAME_OVER`/`VICTORY`, since no piece is falling there); the header icon is **hidden while `PLAYING` or `PAUSED`**, and the **only** way to open it during a run is the "Controls" button inside the pause overlay (below Resume) — a piece can never be falling behind the modal.

| Action | Keyboard | Touch |
|---|---|---|
| Move left | `←` | `◀` button |
| Move right | `→` | `▶` button |
| Soft drop | `↓` | `▼` button |
| Hard drop | `Space` | `⤓` button (`controls.hardDrop`) |
| Rotate clockwise | `↑` or `X` | `⟳` button |
| Rotate counterclockwise | `Z` | `⟲` button |
| Hold | `C` or `Shift` | hold button (`controls.hold`) |
| Pause / Resume | `P` or `Esc` | header pause toggle (desktop); touch control bar toggle (mobile) |
| Restart (after game over / victory) | `Enter` | on-screen button |

Held `←`/`→` auto-repeat via DAS/ARR. Touch buttons support press-and-hold for movement/soft drop where applicable.

**Escape key priority.** `Esc` closes the topmost open modal (controls help, the pause-overlay exit-confirm, the scoreboard clear-history confirm) instead of toggling pause; only when no modal is open does `Esc` (or `P`) toggle pause. This applies to `P` too — while a modal is open, `P` is ignored rather than silently resuming the game behind it. The controller (`useTetris`) owns this via a single "current modal close handler" ref that components register while their modal is mounted.

---

## Game States

```
States:
  IDLE       → start screen; choose starting level, view scoreboard/controls; no piece falling
  PLAYING    → a run is active, pieces fall
  PAUSED     → run suspended; board hidden/dimmed with the pause overlay (state.paused); timer frozen
  GAME_OVER  → run ended by block/lock out; final score shown; run recorded
  VICTORY    → level 15 completed; congratulation shown; run recorded

Transitions:
  IDLE      → PLAYING   : player starts a run
  PLAYING   → PAUSED    : player pauses
  PAUSED    → PLAYING   : player resumes
  PLAYING   → GAME_OVER : block out or lock out
  PLAYING   → VICTORY   : cumulative credit ≥ 600 (level 15 complete)
  GAME_OVER → IDLE      : player restarts / returns to start
  VICTORY   → IDLE      : player restarts / returns to start
```

Overlays that live **outside** the FSM (like space-explorer's controls overlay): the **controls help modal** and the **scoreboard/clear-history confirm** dialog. The `elapsedMs` timer runs only in `PLAYING` and is frozen in `PAUSED`.

---

## Data Model

### Core types

```typescript
type TetriminoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
type RotationState = 0 | 1 | 2 | 3;              // 0, R, 2, L
type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';
type CellValue = TetriminoType | null;            // null = empty
type SpinResult = 'none' | 'mini' | 'full';

interface ActivePiece {
  type: TetriminoType;
  rotation: RotationState;
  x: number;                 // column of the piece's bounding-box origin
  y: number;                 // row of the origin (may be negative in the buffer)
}

interface LockState {
  resting: boolean;          // piece cannot move down
  elapsedMs: number;         // time accrued toward LOCK_DELAY_MS
  resets: number;            // move/rotation resets used (≤ MAX_LOCK_RESETS)
  lastActionWasRotation: boolean; // for T-Spin detection
}

interface ScoreBreakdown {
  regular: number;           // line clears + soft/hard drop
  bonus: number;             // T-Spin, B2B, combo, perfect clear
}

interface GameState {
  status: GameStatus;
  board: CellValue[][];      // rows × 10, includes hidden buffer rows
  active: ActivePiece | null;
  hold: TetriminoType | null;
  holdsRemaining: number;    // starts at MAX_HOLDS, floor 0
  holdUsedThisPiece: boolean;// blocks consecutive holds
  queue: TetriminoType[];    // visible upcoming pieces (≥ 5)
  startLevel: number;        // 1..15
  level: number;             // current level
  creditedLines: number;     // rational; toward current goal
  levelGoal: number;         // credited lines needed for current level
  linesCleared: number;      // physical lines cleared this run
  score: number;
  breakdown: ScoreBreakdown;
  combo: number;             // -1/0 = no combo
  backToBack: boolean;       // B2B chain active
  lock: LockState;
  elapsedMs: number;         // frozen outside PLAYING
}
```

### Randomizer & history

```typescript
interface BagState {
  bag: TetriminoType[];      // remaining pieces in current 7-bag
}

interface GameRecord {
  id: string;
  date: string;              // ISO
  startLevel: number;
  endLevel: number;
  linesCleared: number;
  score: number;
  regularPoints: number;
  bonusPoints: number;
  durationMs: number;
  outcome: 'GAME_OVER' | 'VICTORY';
}

interface Scores {
  records: GameRecord[];     // ≤ 50, most recent first
  best: GameRecord | null;   // pinned; never pruned
}
```

### Preferences

```typescript
interface Prefs {
  language: 'en' | 'es';
  muted: boolean;
  startLevel: number;        // 1..15
}
```

### localStorage keys

| Key | Shape | Purpose |
|---|---|---|
| `tetris_prefs` | `Prefs` | Language, mute, last starting level |
| `tetris_scores` | `Scores` | Match history (≤ 50) + pinned all-time best |

The in-progress `GameState` is intentionally **not** persisted; a page reload starts fresh at the start screen.

---

## i18n Keys Required

Both `en.json` and `es.json` carry identical, non-empty key sets. Illustrative (not exhaustive):

```jsonc
{
  "game.title": "Tetris",
  "hud.hold": "Hold",
  "hud.toHold": "To hold",
  "hud.next": "Next",
  "hud.level": "Level",
  "hud.score": "Score",
  "hud.lines": "Lines",
  "hud.remaining": "Remaining",

  "start.title": "Tetris",
  "start.play": "Play",
  "start.startLevel": "Starting level",
  "start.scoreboard": "Scoreboard",
  "start.controls": "Controls",

  "state.paused": "Paused",
  "state.resume": "Resume",
  "state.gameOver": "Game Over",
  "state.finalScore": "Final score",
  "state.retry": "Retry",
  "state.victory": "You win!",
  "state.victoryBody": "You cleared all 15 levels.",
  "state.menu": "Main menu",
  "state.exitConfirm": "Exit to the main menu? The current run will be lost and not saved.",
  "state.exitConfirmYes": "Exit",
  "state.exitConfirmNo": "Cancel",

  "controls.title": "Controls",
  "controls.moveLeft": "Move left",
  "controls.moveRight": "Move right",
  "controls.softDrop": "Soft drop",
  "controls.hardDrop": "Hard drop",
  "controls.rotateCw": "Rotate clockwise",
  "controls.rotateCcw": "Rotate counterclockwise",
  "controls.hold": "Hold",
  "controls.pause": "Pause / Resume",

  "scoreboard.title": "Scoreboard",
  "scoreboard.date": "Date",
  "scoreboard.lines": "Lines",
  "scoreboard.score": "Score",
  "scoreboard.bonus": "Bonus",
  "scoreboard.regular": "Regular",
  "scoreboard.startLevel": "Start",
  "scoreboard.endLevel": "End",
  "scoreboard.duration": "Time",
  "scoreboard.best": "Best",
  "scoreboard.empty": "No games yet",
  "scoreboard.clear": "Clear history",
  "scoreboard.clearConfirm": "Delete all saved games? This cannot be undone.",
  "scoreboard.confirm": "Delete",
  "scoreboard.cancel": "Cancel",
  "scoreboard.prev": "Previous",
  "scoreboard.next": "Next",

  "nav.language": "Language",
  "nav.mute": "Mute",
  "nav.unmute": "Unmute",

  "warning.storageReset": "Saved data was invalid and has been reset."
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

**Architecture:** layer-based **extended with domain folders** (as space-explorer). The engine is pure and `dt`-driven; a single controller hook (`useTetris`) is the only bridge between logic and React and owns the `requestAnimationFrame` loop, input, timers, audio, and all `localStorage` side effects. Components render state and call the controller; they contain no game logic. No new runtime libraries beyond the monorepo standard.

Planned module layout:

```
frontend/src/
├── components/     # App, Board, Cell, HoldPanel, NextQueue, StatsPanel, Header,
│                   #   TouchControls, PauseOverlay, GameOverOverlay, VictoryOverlay,
│                   #   StartScreen, Scoreboard, ControlsModal, LanguageToggle, MuteToggle,
│                   #   useTetris (controller hook), usePrefs, format (time helper)
├── i18n/           # en.json, es.json, config.ts
├── layouts/        # Layout.astro
├── pages/          # index.astro (renders <App client:only="react" />)
├── styles/         # global.css (neon dark palette, responsive, scanline)
└── lib/
    ├── constants/  # pieces, srs, levels, scoring, input, storage, game, ui
    ├── engine/     # board.ts (create/place/collision/clearLines/isPerfectClear),
    │               #   piece.ts (spawn, cells for type+rotation), gravity/lock helpers
    ├── rotation/   # srs.ts (rotate + wall-kick resolution)
    ├── randomizer/ # bag.ts (7-bag Fisher–Yates)
    ├── scoring/    # scoring.ts (points), progression.ts (line-credit, goal, level-up),
    │               #   tspin.ts (detectSpin)
    ├── history/    # records.ts (buildRecord, addRecord w/ prune + best pin)
    ├── state/      # transitions.ts (pure FSM), useTetris.ts (controller)
    └── validation/ # localStorage.ts (validatePrefs/validateScores), result.ts
```

---

## Environment Variables

### `infra/.env`

```
SUBDOMAIN=              # tetris
DOMAIN_NAME=
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

### Feature: Initialization & start screen

```gherkin
Feature: Start screen

  Scenario: Idle on first load
    Given the player opens the game
    Then the game is in IDLE state
    And no piece is falling
    And the starting level defaults to 1 (or the last stored value)

  Scenario: Choose starting level and play
    Given the game is in IDLE state
    When the player sets the starting level to 3
    And the player starts a run
    Then the game transitions to PLAYING
    And the current level is 3
    And the gravity is 0.618 seconds per row
    And the level goal is 30 credited lines
```

### Feature: Piece movement and gravity

```gherkin
Feature: Movement and gravity

  Scenario: Spawn from 7-bag
    Given a new run starts
    Then the first seven pieces contain each tetrimino exactly once

  Scenario: Horizontal movement is bounded
    Given an active piece against the left wall
    When the player moves left
    Then the piece does not move and stays in bounds

  Scenario: Gravity steps the piece down
    Given the current level gravity interval elapses
    Then the active piece descends one row

  Scenario: Soft drop scores per cell
    Given the player soft-drops the piece 4 rows
    Then the score increases by 4

  Scenario: Hard drop locks immediately and scores double per cell
    Given the piece is 8 rows above its landing
    When the player hard-drops
    Then the piece locks in place
    And the score increases by 16
```

### Feature: Rotation and wall kicks

```gherkin
Feature: SRS rotation

  Scenario: Rotate clockwise in open space
    Given an active T piece in spawn orientation
    When the player rotates clockwise
    Then the piece is in the R orientation

  Scenario: Wall kick off the left wall
    Given a piece flush against the left wall where a naive rotation would overlap the wall
    When the player rotates
    Then a wall-kick offset is applied so the rotation succeeds

  Scenario: Rotation blocked when no kick fits
    Given a piece boxed in on all kick candidates
    When the player rotates
    Then the piece does not rotate
```

### Feature: T-Spin detection and scoring

```gherkin
Feature: T-Spin

  Scenario: Full T-Spin Double
    Given a T piece rotated into a slot with three or more corners filled and both front corners filled
    And the rotation clears two lines
    Then the action is a T-Spin Double
    And the score increases by 1200 times the level
    And the credited lines increase by 12

  Scenario: Mini T-Spin Single
    Given a T piece spun into a slot meeting the mini condition
    And one line clears
    Then the action is a Mini T-Spin Single
    And the score increases by 200 times the level

  Scenario: No T-Spin without a rotation
    Given the last action before lock was a move, not a rotation
    Then no T-Spin is credited even if corners are filled
```

### Feature: Line clears, combos, back-to-back, perfect clear

```gherkin
Feature: Clears and bonuses

  Scenario: Tetris scoring
    Given four lines clear at once at level 2
    Then the score increases by 1600
    And the credited lines increase by 8

  Scenario: Back-to-back bonus
    Given the previous clear was a Tetris
    And the next clear is also a Tetris
    Then the second Tetris adds an extra 0.5 times its action total
    And it credits an extra 0.5 times its credited value

  Scenario: Back-to-back broken by a non-difficult clear
    Given a back-to-back chain is active
    When the player clears a single line (not a T-Spin)
    Then the back-to-back chain ends

  Scenario: Combo increments on consecutive clears
    Given the player clears a line on consecutive pieces
    Then the combo counter increments and awards 50 times combo times level

  Scenario: Perfect clear bonus
    Given a line clear empties the entire board
    Then a perfect-clear bonus is added on top
```

### Feature: Hold

```gherkin
Feature: Hold

  Scenario: First hold pulls from the queue
    Given the hold slot is empty
    When the player holds
    Then the active piece moves to hold
    And a new piece spawns from the queue
    And holds remaining decreases by one

  Scenario: Cannot hold twice before locking
    Given the player just held a piece
    When the player holds again before the piece locks
    Then the hold is ignored

  Scenario: Hold cap reached
    Given holds remaining is 0
    When the player holds
    Then nothing happens and no piece is swapped
```

### Feature: Level progression

```gherkin
Feature: Level progression

  Scenario: Level up on reaching the goal
    Given the run started at level 1 with a goal of 5 credited lines
    When the credited lines reach 5
    Then the level becomes 2
    And the gravity becomes 0.793 seconds per row
    And the new goal is 10 credited lines

  Scenario: Victory on completing level 15
    Given the run is on level 15
    When the cumulative credited lines reach 600
    Then the game transitions to VICTORY
    And the run is recorded
```

### Feature: Game over

```gherkin
Feature: Game over

  Scenario: Block out
    Given the stack reaches the spawn area
    When a new piece cannot spawn without overlap
    Then the game transitions to GAME_OVER
    And the run is recorded

  Scenario: Restart from game over
    Given the game is in GAME_OVER
    When the player restarts
    Then the game returns to IDLE with a cleared board
```

### Feature: Pause

```gherkin
Feature: Pause

  Scenario: Pause freezes the run
    Given the game is PLAYING
    When the player pauses
    Then the game is PAUSED
    And the elapsed timer stops advancing
    And the board is hidden behind the pause overlay

  Scenario: Resume
    Given the game is PAUSED
    When the player resumes
    Then the game is PLAYING again

  Scenario: Exit to menu from pause requires confirmation
    Given the game is PAUSED
    When the player selects "exit to menu"
    Then a confirmation dialog is shown warning the run will be lost and not saved
    And the game remains PAUSED until the player responds

  Scenario: Confirming exit returns to the start screen
    Given the exit confirmation dialog is open
    When the player confirms
    Then the game returns to IDLE
    And the in-progress run is discarded without being recorded

  Scenario: Cancelling exit keeps the run paused
    Given the exit confirmation dialog is open
    When the player cancels
    Then the dialog closes
    And the game remains PAUSED
```

### Feature: Scoreboard / history

```gherkin
Feature: Match history

  Scenario: A finished run is recorded
    Given a run ends in GAME_OVER
    Then a record with date, lines, score, bonus/regular split, start and end level, and duration is saved

  Scenario: History caps at 50 but keeps the best
    Given 50 records already exist
    And a new lower-scoring run ends
    Then the oldest record is dropped
    And the stored all-time best is unchanged even if it is older than the newest 50

  Scenario: Pagination
    Given more than 10 records exist
    Then the scoreboard shows 10 per page with navigation

  Scenario: Clearing history requires confirmation
    Given records exist
    When the player clears history and confirms
    Then all records and the stored best are removed
```

### Feature: Audio

```gherkin
Feature: Sound

  Scenario: Mute toggle persists
    Given sound is on
    When the player mutes
    Then no sound effects or music play
    And the muted preference is stored and restored on reload

  Scenario: Soft drop plays a sound
    Given the game is PLAYING and sound is on
    When the player soft-drops the active piece
    Then the soft-drop sound effect plays

  Scenario: Pausing plays a sound
    Given the game is PLAYING and sound is on
    When the player pauses
    Then the pause sound effect plays
    And resuming does not play a distinct sound

  Scenario: Opening a modal plays a sound
    Given sound is on
    When the player opens the controls modal or the scoreboard screen
    Then the modal-open sound effect plays
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

  Scenario: Invalid preferences are reset
    Given corrupted data exists in tetris_prefs
    When the page loads
    Then tetris_prefs is reset to defaults
    And a visible warning is shown

  Scenario: Invalid history is discarded
    Given tetris_scores is not a valid Scores shape
    When the page loads
    Then invalid records are discarded (non-array resets all)
    And a visible warning is shown

  Scenario: Out-of-range starting level is clamped
    Given a stored startLevel of 99
    When the page loads
    Then the starting level is clamped into 1..15
```

---

## Unit Test Definitions

> Tests are defined here before implementation. No test is written without a definition here. No definition is added or modified after Stage 2 without developer authorization.

### Board & pieces — `T-BRD`

| Test ID | Objective | Expected |
|---|---|---|
| `T-BRD-01` | Empty board has correct dimensions and all null | 10 columns, visible+buffer rows, all `null` |
| `T-BRD-02` | Placing a piece writes its cells | Cells set to the piece type |
| `T-BRD-03` | Collision detected against walls, floor, and blocks | `true` on overlap/out of bounds |
| `T-BRD-04` | Full rows are cleared and rows above collapse | Cleared count + shifted board |
| `T-BRD-05` | Perfect clear detected when board empties | `true` only when no cells remain |
| `T-BRD-06` | Spawn cells for each type+rotation match SRS geometry | Correct coordinate sets |

### Rotation (SRS) — `T-ROT`

| Test ID | Objective | Expected |
|---|---|---|
| `T-ROT-01` | Clockwise/counterclockwise cycle through 0→R→2→L→0 | Correct rotation states |
| `T-ROT-02` | Wall kick applies first legal offset off a wall | Piece shifted per kick table |
| `T-ROT-03` | Rotation rejected when no kick offset is legal | Piece unchanged |
| `T-ROT-04` | I-piece uses the dedicated I kick table | Correct offsets |
| `T-ROT-05` | O-piece rotation keeps its footprint | No cell change |

### 7-bag randomizer — `T-BAG`

| Test ID | Objective | Expected |
|---|---|---|
| `T-BAG-01` | Each bag contains all seven pieces once | Permutation of the 7 |
| `T-BAG-02` | A new bag is drawn only when the current empties | No repeats across a bag boundary beyond bag rules |

### T-Spin — `T-TSP`

| Test ID | Objective | Expected |
|---|---|---|
| `T-TSP-01` | 3-corner rotation into slot → full T-Spin | `full` |
| `T-TSP-02` | Mini condition → mini T-Spin | `mini` |
| `T-TSP-03` | Last action was a move → no spin | `none` |
| `T-TSP-04` | Index-4 kick upgrades mini to full | `full` |

### Scoring — `T-SCORE`

| Test ID | Objective | Expected |
|---|---|---|
| `T-SCORE-01` | Single/Double/Triple/Tetris × level | Correct points |
| `T-SCORE-02` | T-Spin variants × level | Correct points |
| `T-SCORE-03` | Soft/hard drop points | 1×cells / 2×cells |
| `T-SCORE-04` | Back-to-back adds 0.5× action total | Correct bonus, only for difficult clears |
| `T-SCORE-05` | Combo = 50 × combo × level | Correct combo points |
| `T-SCORE-06` | Perfect clear bonuses | Correct per-variant points |
| `T-SCORE-07` | Bonus vs regular split recorded correctly | `breakdown` matches |

### Progression — `T-PROG`

| Test ID | Objective | Expected |
|---|---|---|
| `T-PROG-01` | Goal for start level N = 5·N·(N+1)/2 | e.g. N=1→5, N=3→30 |
| `T-PROG-02` | Subsequent level goal = 5·L | Correct |
| `T-PROG-03` | Line-credit table maps actions to credited lines | Correct values |
| `T-PROG-04` | B2B adds 0.5× credited value | Correct |
| `T-PROG-05` | Reaching goal increments level and gravity | Level+1, gravity from table |
| `T-PROG-06` | Cumulative to finish level 15 is 600 from any start | 600 |

### Lock delay — `T-LOCK`

| Test ID | Objective | Expected |
|---|---|---|
| `T-LOCK-01` | Resting piece locks after LOCK_DELAY_MS of dt | Locks |
| `T-LOCK-02` | Move/rotation resets timer up to MAX_LOCK_RESETS | Timer reset, bounded |
| `T-LOCK-03` | Force-lock after resets exhausted | Locks despite reset attempt |

### Hold — `T-HOLD`

| Test ID | Objective | Expected |
|---|---|---|
| `T-HOLD-01` | First hold pulls from queue, decrements remaining | Correct swap + counter |
| `T-HOLD-02` | Consecutive hold before lock is ignored | No change |
| `T-HOLD-03` | Hold disabled at 0 remaining | No change |

### State transitions — `T-ST`

| Test ID | Objective | Expected |
|---|---|---|
| `T-ST-01` | IDLE → PLAYING on start | `PLAYING` |
| `T-ST-02` | PLAYING → PAUSED / PAUSED → PLAYING | Correct, timer frozen while paused |
| `T-ST-03` | PLAYING → GAME_OVER on block/lock out | `GAME_OVER` |
| `T-ST-04` | PLAYING → VICTORY on 600 credit | `VICTORY` |
| `T-ST-05` | GAME_OVER/VICTORY → IDLE on restart, board cleared | `IDLE`, reset |

### History — `T-HIST`

| Test ID | Objective | Expected |
|---|---|---|
| `T-HIST-01` | buildRecord captures all fields incl. bonus/regular split | Correct record |
| `T-HIST-02` | addRecord prepends and caps at 50 | ≤ 50, newest first |
| `T-HIST-03` | Best is pinned and survives pruning | Best unchanged |
| `T-HIST-04` | Clearing removes records and best | Empty + null |

### localStorage validation — `T-LS`

| Test ID | Objective | Expected |
|---|---|---|
| `T-LS-01` | Valid prefs pass | Parsed object |
| `T-LS-02` | Invalid language/mute fails/resets | Error result / default |
| `T-LS-03` | startLevel clamped to 1..15 | Clamped |
| `T-LS-04` | Tampered JSON resets to default | Error result, default applied |
| `T-LS-05` | Invalid scores discarded (records array-validated, best guarded) | Cleaned/default |

### i18n — `T-I18N`

| Test ID | Objective | Expected |
|---|---|---|
| `T-I18N-01` | EN and ES have identical key sets | Equal |
| `T-I18N-02` | No empty values | All non-empty |

---

## Implementation Stages

Stages run in strict order. Claude Code stops after each stage and waits for developer authorization to proceed. No stage is skipped.

### Stage 1 — Infra

**Scope:** the game's AWS infrastructure; no frontend code.

- `infra/bin/app.ts` consuming `GameStack` from `@arcade/infra` with `STACK_ID = TetrisStack`
- `infra/.env.example`, `infra/cdk.json`, `infra/readme.md`
- Register `tetris/frontend` and `tetris/infra` workspaces; add `.github/workflows/deploy-tetris.yml` (`tetris/**` filter, `TETRIS_BUCKET_NAME` / `TETRIS_DISTRIBUTION_ID` secrets)

**Validation:** `npm --prefix tetris/infra run typecheck` passes; developer confirms the subdomain resolves after `cdk deploy`.

### Stage 2 — Failing tests

**Scope:** write every test defined above; all must fail (no implementation).

- `engine/__tests__/board.test.ts` — `T-BRD-*`
- `rotation/__tests__/srs.test.ts` — `T-ROT-*`
- `randomizer/__tests__/bag.test.ts` — `T-BAG-*`
- `scoring/__tests__/tspin.test.ts` — `T-TSP-*`
- `scoring/__tests__/scoring.test.ts` — `T-SCORE-*`
- `scoring/__tests__/progression.test.ts` — `T-PROG-*`
- `engine/__tests__/lock.test.ts` — `T-LOCK-*`
- `state/__tests__/hold.test.ts` — `T-HOLD-*`
- `state/__tests__/transitions.test.ts` — `T-ST-*`
- `history/__tests__/records.test.ts` — `T-HIST-*`
- `validation/__tests__/localStorage.test.ts` — `T-LS-*`
- `i18n/__tests__/i18n.test.ts` — `T-I18N-*`

No implementation files this stage; `vitest` reports all failing.

### Stage 3 — Implementation

**Scope:** application code making Stage 2 pass, plus the full UI. Order within the stage:

1. Constants and enums (`pieces`, `srs`, `levels`, `scoring`, `input`, `storage`, `game`, `ui`)
2. i18n module (`en.json`, `es.json`, config)
3. localStorage validation layer
4. Pure engine: `board`, `piece`, gravity/lock helpers
5. `rotation/srs`, `randomizer/bag`
6. `scoring/scoring`, `scoring/progression`, `scoring/tspin`
7. `history/records`
8. `state/transitions` (pure FSM)
9. `state/useTetris` controller (rAF loop, input/DAS-ARR, lock timer, audio, localStorage side effects)
10. React components (Board, HUD panels, queue, overlays, start screen, scoreboard, controls modal, touch controls)
11. Astro pages/layouts
12. CSS (neon dark palette, responsive, scanline, self-hosted fonts)
13. Audio system with a mute toggle and **placeholder** SFX/music hooks (see Stage 5)

After each sub-step run `vitest`; proceed only when covering tests pass.

### Stage 4 — Documentation

**Scope:** finalize `tetris/spec.md` (decisions log), write `tetris/claude.md` (overview, working style, directory map, how to modify rules, security checklist) and `tetris/readme.md` (dev/test/deploy). No code changes.

### Stage 5 — Audio assets (future; separate authorization)

Wire real audio files into the placeholder hooks from Stage 3: background music (loop) started by a user gesture (autoplay policy), plus SFX for **move, rotate, soft drop, hard drop, lock, line clear, tetris, T-Spin, level-up, hold, bonus/back-to-back, game over, pause, modal open**. Assets land under `frontend/public/audio/` (a `.gitkeep` holds the folder until then). No engine/test changes expected.

### Stage 6 — Multiplayer (future; separate authorization; see below)

Not implemented now. Only the architecture is prepared so it can be added without rewrites.

---

## Future Considerations — Multiplayer (design intent, no code)

A future mode lets a player **create/join a room** and see other players' boards alongside their own (spectator view). The Stage 1–4 architecture must not preclude it:

- The **engine stays pure, deterministic, and serializable** — a full `GameState` (plus the `BagState`) can be snapshotted and transmitted; nothing in the pure layer reads a clock or global.
- The **7-bag randomizer is isolated** so it can be **seeded** for a shared piece sequence across players in a room.
- **Rendering is state-driven** (`Board`/panels take a `GameState`), so a read-only *opponent board* is just the same components fed a remote state — no logic duplication.
- All wall-clock, input, and I/O live only in `useTetris`; a transport layer (WebSocket/room service) would sit beside it, never inside the engine.
- A backend (`GameBackendStack` placeholder in `@arcade/infra`) would be introduced then, with its own spec update and stages.

This is **not** built yet and is out of scope until explicitly authorized.

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-09 | Stack is Astro 5 + React 19 (not the design's Vue 3) | Monorepo contract; reuse `@arcade/infra`, template, i18n, CI. Design handoff explicitly allows re-implementing in the target stack |
| 2026-07-09 | Dark-only, no theme toggle (Deviation 1) | Design mandate — one fixed neon design |
| 2026-07-09 | Self-host Orbitron / Space Grotesk (Deviation 2) | CSP forbids external resources |
| 2026-07-09 | Five game states, adding a terminal `VICTORY` alongside the prompt's four | Completing level 15 needs a terminal win + record instead of endless play; the template's state list is illustrative, so this is a design definition, not a contract deviation |
| 2026-07-09 | Full modern ruleset: SRS + wall kicks, 3-corner T-Spin, lock delay w/ move-reset, ghost piece, 7-bag | Required for the T-Spin/B2B scoring table to be meaningful; developer confirmed |
| 2026-07-09 | Special-action "line-clears" table credits progress toward the level goal (not just points) | Developer clarification: e.g. a Tetris advances 8 toward the goal |
| 2026-07-09 | Next queue shows 5 pieces | Design mockup shows 5 (overrides the "max 4" prose) |
| 2026-07-09 | Goal = 5·N·(N+1)/2 for the start level, then 5·L; always 600 to finish level 15 | Developer worked example (start at 3 → 30 then 20…) |
| 2026-07-09 | Include Combos + Perfect Clear using standard Guideline values (points only), parameterized | Developer opted in; values tunable in `constants/scoring.ts` |
| 2026-07-09 | Hold capped at 10/run, standard no-consecutive-hold rule kept | Developer requirement + guideline |
| 2026-07-09 | History: 50 records, newest first, 10/page; bonus vs regular points split; all-time best pinned and never pruned; clear needs confirmation | Developer requirement |
| 2026-07-09 | Persist only prefs + history; not the in-progress game | Matches space-explorer convention; simpler and safe |
| 2026-07-09 | Multiplayer noted as future architecture only (seedable bag, serializable state, state-driven rendering) | Developer asked to structure for easy later addition, no code now |
| 2026-07-10 | Internal board is 10×22 (2 hidden buffer rows); pieces spawn at row 2 so they appear fully at the top of the visible field; buffer used only for top-out | Clean, fully-visible spawn without a vanish zone |
| 2026-07-10 | Added `tryRotate` (returns the kick index) beside the tested `rotate`, which now delegates to it | Controller needs the kick index for the index-4 Mini→full T-Spin upgrade without changing the locked `rotate` signature |
| 2026-07-10 | Regular/bonus split: plain line-clear bases + drops = regular; T-Spin/Mini totals, B2B increment, combo, perfect clear = bonus | Matches the history "bonus vs regular points" requirement; encoded in `T-SCORE-07` |
| 2026-07-10 | "Back-to-Back Bonus 0.5 × Total Line Clears" (credit table) = 0.5 × the action's own credited value | Developer-flagged interpretation; produces the half-line credits, tunable |
| 2026-07-10 | Combo bonus uses the pre-increment chain count (first clear in a chain scores 0 combo points) | Standard combo semantics; 50 × combo × level |
| 2026-07-10 | Stage 3 shipped: pure engine + `useTetris` controller + full UI; 52 tests green, `astro check` clean, build OK, browser-verified. Fonts (woff2) and audio (mp3) assets scaffolded with fallbacks, pending real files | Full implementation of the game per this spec |
| 2026-07-15 | Wired soft-drop SFX (already in scope, previously unwired); added two new SFX events, `pause` (pause only, not resume) and `modalOpen` (shared by ControlsModal and the scoreboard screen) | Developer requested completing the soft-drop hookup and adding pause/modal-open feedback; single shared `modalOpen` event and pause-only trigger confirmed with developer |
| 2026-07-15 | Real audio assets (all 15 SFX + music, free-to-use Pixabay sources) added under `public/audio/`; credits logged in `public/audio/readme.md` | Stage 5 scope complete — no more placeholder audio |
| 2026-07-15 | Mobile layout reworked: HOLD/stats/NEXT compact into one row above the board (CSS grid areas, same DOM feeding both desktop 3-column and mobile row/board/controls compositions); NEXT shows only the immediate next piece and the stats panel drops its level row on narrow viewports (level stays visible in the header); pause toggle duplicated into the touch control bar (hidden on desktop, where the header toggle remains authoritative) | Developer-provided mockup: previous mobile layout required scrolling past a tall single-column stack (5-piece NEXT panel) to reach the touch controls, and the header pause button was effectively unreachable at narrow widths; developer confirmed showing only 1 next piece and moving pause to the touch bar on mobile |
| 2026-07-16 | Added an "exit to menu" button below Resume in the pause overlay, guarded by a confirmation modal (run is lost, not saved) | Developer request; reuses the existing `goToMenu` action (same one game-over/victory already use) and the scoreboard's confirm-modal pattern (`modal-backdrop`/`card`), so no FSM or locked-test changes were needed |
| 2026-07-16 | Fixed: opening the controls modal during `PLAYING` didn't pause the game (piece kept falling behind it); opening it during `PAUSED` left it open if `Esc` was pressed, since `Esc` was hardwired to `togglePause` with no awareness of open modals. Fix: (1) the header's controls icon is now hidden during `PLAYING`/`PAUSED` — a "Controls" button was added to the pause overlay (below Resume, above the exit-to-menu button) as the only in-run entry point, so a modal can never open over a live board; (2) `useTetris` now owns a single "open modal's close handler" ref via `registerModalClose`, which every modal (controls, pause-exit-confirm, scoreboard clear-confirm) registers while mounted — `Esc` closes that modal instead of toggling pause, and `P` is ignored rather than resuming behind it, when one is open | Developer-reported bug + design proposal (move Controls into the pause overlay, make `Esc` universally close-topmost-modal-first); keeps the "controller owns all input" invariant (`tetris/claude.md`) — modal/pause-key priority lives in `useTetris`, not scattered across components |
