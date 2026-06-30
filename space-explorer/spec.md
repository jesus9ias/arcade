# Space Explorer — Game Spec

> This document is the source of truth for Claude Code on this game. It inherits the full contract defined in the monorepo `spec.md`. Read both documents fully before acting on any prompt. In case of conflict, the monorepo `spec.md` takes precedence unless a deviation is explicitly declared in the Deviations section below.

---

## Game Overview

Space Explorer is a physics-based 2D mission game. The player pilots a rover over alien planets, descending through the atmosphere to collect mineral samples from designated landing zones, then escaping the planet by firing upward. The rover moves exclusively through its propulsors — there is no wheeled ground movement. Gravity, limited fuel, and irregular terrain are the core challenge.

The game ships with 12 planets (levels). The architecture is designed to accommodate any number of additional levels through configuration alone.

**Subdomain:** Configured via `SUBDOMAIN` in `infra/.env`
**Folder:** `space-explorer/`
**Backend required:** No

---

## Deviations from Monorepo Contract

Water turbines (Stage 5 sub-step 1) and the laser / subsurface samples (Stage 5 sub-step 2) are implemented. Sub-step 1 wires turbine mode, underwater thrust, electricity depletion, `m`-key mode switching, the TURBINE→PROPULSOR surface-break, and the turbine-level stuck-timeout; Glacius carries its underwater sample (`glacius-4`). Sub-step 2 adds the `x` laser: fired while grounded for `LASER_FUEL_COST` fuel, it lowers a `LASER_WIDTH` terrain beam by `LASER_DEPTH` (mutating a mission-owned working heightmap) and exposes any subsurface sample in the beam; Glacius carries its subsurface sample (`glacius-5`). Levels 4–12 (sub-step 4) remain deferred — no new levels are written before that sub-step is explicitly authorized.

---

## Game Rules

### The Rover

- The rover is a rectangle of fixed dimensions `ROVER_WIDTH` × `ROVER_HEIGHT` (game units).
- It has a position (top-left corner, in game units), a velocity vector `(vx, vy)`, and an active propulsor mode.
- The rover carries **fuel** (propulsors) and, on levels with turbines, **electricity** (turbines). Both are finite and defined per level.
- Any combination of the three propulsors can be active simultaneously.

### Gravity

- Each planet has a `gravity` multiplier relative to Earth (`EARTH_GRAVITY` game units/s²).
- Every physics frame, `vy` increases by `gravity × EARTH_GRAVITY × dt` (positive vy = downward).
- When the rover is grounded on flat terrain, gravity is cancelled and `vy` is held at 0.

### Propulsors

Three propulsors: **left** (pushes rover rightward), **right** (pushes rover leftward), **bottom** (pushes rover upward).

Each active propulsor applies `PROPULSOR_FORCE` acceleration in its direction per second and consumes `FUEL_CONSUMPTION_RATE` fuel per second.

Propulsors only work in the atmosphere. Activating propulsors underwater produces no thrust and still consumes fuel.

### Water Turbines — Phase 2

On levels where water turbines are available, the rover can switch to turbine mode (`m` key). Turbines allow movement underwater using electricity, mirroring the propulsor directions. Activating turbines in atmosphere produces no thrust and wastes electricity.

### Mode Switching

The rover is always in one of two modes: `PROPULSOR` or `TURBINE`.

- Default: `PROPULSOR`.
- `m` toggles mode only when the current level has water turbines. No effect otherwise.
- When switching from `TURBINE` to `PROPULSOR` while underwater with the up key held: the bottom propulsor fires immediately, allowing the rover to break the water surface.
- Using the wrong mode for the environment produces no thrust and consumes the resource.

### Terrain

- Each level defines a **heightmap**: an array of integer heights (game units from the bottom of the scene), one value per column.
- A **flat zone** is a contiguous range of columns where all heights are equal. A flat zone is a valid landing surface only when its width ≥ `ROVER_WIDTH`.
- **Water zones** are defined per level as column ranges with a `surfaceHeight`. The rover enters underwater state when its center y-position is below the water surface.
- **Sample locations** are defined per level as column indices. Every sample location coincides with a valid flat zone.

### Landing

The rover lands safely when all of the following hold at the moment its bottom edge contacts terrain:

1. Contact is within a valid flat zone (width ≥ `ROVER_WIDTH`, rover horizontally centered within it).
2. Vertical velocity `vy ≤ MAX_LANDING_SPEED`.
3. Lateral velocity `|vx| ≤ MAX_LANDING_LATERAL_SPEED`.

If any condition fails when the rover touches terrain → rover **destroyed** → MISSION_FAILED.

Touching terrain during lateral movement (while not in a downward landing approach) also destroys the rover.

### Sample Collection

- When the rover lands safely at a sample location's flat zone, the sample is automatically collected.
- Landing safely on a flat zone with no sample: rover is grounded and can take off again; nothing is collected.
- Collected samples are permanent within the mission and cannot be lost.
- **Subsurface samples (Phase 2):** require the laser to be fired before landing; without the laser the landing succeeds but no sample is collected.

### Takeoff

- From ground, activating the bottom propulsor lifts the rover (if fuel > 0).
- Activating lateral propulsors while grounded when the adjacent terrain is not flat causes collision with the terrain edge → destroyed.

### Escape

- When all samples are collected, the rover may escape by firing the bottom propulsor until it exits the top edge of the scene → level **complete**.
- If the rover exits the top edge before all samples are collected → mission **aborted** → returns to LEVEL_SELECT with no progress saved.
- If fuel runs out before reaching the top edge → free fall → likely crash → MISSION_FAILED.

### Mission Failure Conditions

1. Rover contacts terrain unsafely (wrong zone, excessive speed, or lateral collision).
2. Rover is submerged on a level without turbines with 0 fuel (stuck, no movement possible) — MISSION_FAILED triggers after `STUCK_TIMEOUT_MS` of no thrust capability.
3. Rover is grounded on land with 0 fuel (stranded — propulsors cannot fire, so it can neither take off nor escape) — MISSION_FAILED triggers after `STUCK_TIMEOUT_MS`.
4. Fuel exhausted before escape is achieved and rover crashes.

On failure: best time is not affected. Player may restart or exit to level select.

### Fuel and Electricity

- Each propulsor active consumes `FUEL_CONSUMPTION_RATE` fuel/s.
- Each turbine direction active consumes `ELECTRICITY_CONSUMPTION_RATE` electricity/s.
- At 0 fuel: no propulsors fire. At 0 electricity: no turbines fire.
- Fuel and electricity are independent resources; the HUD shows the relevant one for the active mode.

### Level Progression

- Levels are unlocked sequentially: level N+1 unlocks only when level N is completed.
- Level 1 is always unlocked.
- Completed levels may be replayed to improve best time.
- Failure on a replay does not affect the existing best time.
- Better time on replay updates the best time.
- Completing the last available level shows a congratulations message.

### Best Time

- Best time = elapsed time from mission start to successful escape.
- Stored per level in `localStorage`.
- Updated only on successful escape and only when the new time is better.

---

## Controls

| Action | Key | Notes |
|---|---|---|
| Left thruster (move right) | `ArrowLeft` | |
| Right thruster (move left) | `ArrowRight` | |
| Bottom thruster (ascend / brake) | `ArrowDown` | Main vertical thruster — the key points where the jet fires (down), the rover reacts upward, mirroring the lateral keys |
| Toggle propulsor / turbine mode | `m` | Only when turbines available on current level |
| Fire laser | `x` | Only while grounded on a laser-equipped level; spends `LASER_FUEL_COST` fuel |
| Show controls | `c` | Toggles the controls overlay during a mission; opening it pauses the mission, closing it resumes |
| Pause / options menu | `Escape` | Pauses game; shows Restart / Continue / Exit |

Multiple thrusters may be held simultaneously.

Touch: on-screen arrow buttons mirroring keyboard layout; each activates the corresponding thruster while held. Each button's glyph points in the direction its jet fires (`◀` / `▼` / `▶`), so the rover reacts the opposite way.

---

## Game States

```
States:
  LEVEL_SELECT    → level list; no rover on screen
  PLAYING         → mission in progress; physics running
  PAUSED          → physics suspended; options menu visible
  MISSION_FAILED  → rover destroyed or stranded; failure screen
  MISSION_ABORTED → rover exited top edge without all samples; aborted screen
  ESCAPED         → rover exited top edge with all samples; success screen

Transitions:
  LEVEL_SELECT   → PLAYING        : player selects a level
  PLAYING        → PAUSED         : Escape pressed
  PAUSED         → PLAYING        : Continue chosen
  PAUSED         → PLAYING        : Restart chosen (mission resets to initial state)
  PAUSED         → LEVEL_SELECT   : Exit to Missions chosen (no progress saved)
  PLAYING        → MISSION_FAILED : rover destroyed or stuck timeout
  PLAYING        → ESCAPED        : rover exits top with all samples collected
  PLAYING        → MISSION_ABORTED: rover exits top without all samples (abort)
  MISSION_FAILED → PLAYING        : Restart chosen (mission resets)
  MISSION_FAILED → LEVEL_SELECT   : Exit chosen
  MISSION_ABORTED→ PLAYING        : Restart chosen (mission resets)
  MISSION_ABORTED→ LEVEL_SELECT   : Exit to Missions chosen (no progress saved)
  ESCAPED        → LEVEL_SELECT   : Continue (next level unlocked if applicable)
```

---

## Data Model

### Core types

```typescript
type GameStatus = 'LEVEL_SELECT' | 'PLAYING' | 'PAUSED' | 'MISSION_FAILED' | 'MISSION_ABORTED' | 'ESCAPED';
type PropulsorMode = 'PROPULSOR' | 'TURBINE';

interface Vector2 {
  x: number;
  y: number;
}

interface RoverState {
  position: Vector2;        // top-left corner; origin = top-left of scene
  velocity: Vector2;        // game units/s; positive y = downward
  fuel: number;             // remaining propulsor fuel
  electricity: number;      // remaining turbine electricity (0 on levels without turbines)
  mode: PropulsorMode;
  grounded: boolean;        // resting on valid flat terrain
  underwater: boolean;      // center of rover below water surface
  destroyed: boolean;
}

interface SampleState {
  id: string;
  columnIndex: number;      // center column of the sample's flat zone
  subsurface: boolean;      // requires the laser to be exposed before collection
  exposed?: boolean;        // surface samples start exposed; subsurface ones only after the laser
  collected: boolean;
}

interface GameState {
  status: GameStatus;
  levelId: number;
  rover: RoverState;
  samples: SampleState[];
  elapsedMs: number;        // ms since mission start; frozen when not PLAYING
  allSamplesCollected: boolean;
  heightmap?: number[];     // mission-owned working terrain; the laser mutates it. Copied from LevelConfig.heightmap at mission start and reset on restart, leaving the immutable level data untouched
}
```

### Level configuration

```typescript
interface WaterZone {
  startColumn: number;
  endColumn: number;        // inclusive
  surfaceHeight: number;    // game units from bottom of scene
}

interface SampleConfig {
  id: string;
  columnIndex: number;      // center column of flat zone for this sample
  subsurface: boolean;      // Phase 2
}

interface PlanetTheme {
  skyColorTop: string;      // CSS colour
  skyColorBottom: string;
  groundColor: string;
  waterColor: string;
}

type WorldType = 'VERDANT' | 'VOLCANIC' | 'FROZEN'; // extend the catalog per new archetype

interface LevelConfig {
  id: number;
  name: string;
  worldType?: WorldType;      // drives the level-select icon; all bundled levels set it
  distanceFromEarth: string;  // flavour, e.g. "4.2 light years"
  gravity: number;            // multiplier vs Earth (e.g. 0.5, 1.3)
  fuel: number;               // initial propulsor fuel
  electricity: number;        // initial turbine electricity (0 = no turbines)
  tools: {
    laser: boolean;           // Phase 2
    waterTurbines: boolean;
  };
  heightmap: number[];        // height per column (game units from bottom of scene)
  waterZones: WaterZone[];
  samples: SampleConfig[];
  theme: PlanetTheme;
}
```

### Progress

```typescript
interface LevelProgress {
  levelId: number;
  completed: boolean;
  bestTimeMs: number | null;  // null = never completed
}
```

### localStorage keys

| Key | Shape | Purpose |
|---|---|---|
| `space_prefs` | `{ language: string; theme: 'light' \| 'dark' }` | User preferences |
| `space_progress` | `LevelProgress[]` | Completion status and best times |

In-progress `GameState` is intentionally **not** persisted.

---

## World Types & Level-Select Display

Each level declares a `worldType` that drives the icon shown in the level list. The level list renders, per card: the **world icon**, the **level id** formatted as `#NNN` (zero-padded to three digits — `#001`, `#002`, …), then the planet **name**, followed by the best time (or a 🔒 lock icon when the level is still locked).

The world-type → icon catalog (single source of truth: `frontend/src/lib/constants/ui.ts`):

| World type | Meaning | Icon |
|---|---|---|
| `VERDANT` | Lush, vegetated worlds | 🌿 |
| `VOLCANIC` | Molten, iron-rich, scorched worlds | 🌋 |
| `FROZEN` | Icy worlds with frozen lakes | ❄️ |
| `DESERT` | Arid dune worlds, no surface water | 🏜️ |
| `OCEANIC` | Water worlds dominated by deep lakes | 🌊 |
| `TOXIC` | Corrosive worlds with acid lakes | ☣️ |
| `CRYSTALLINE` | Mineral worlds of crystal ridges | 💎 |
| `BARREN` | Cratered rocky / moon worlds | 🌑 |
| `STORM` | Wind-blasted high-gravity worlds | 🌩️ |
| `METALLIC` | Dense metal-rich worlds | ⚙️ |
| _(none declared)_ | Fallback for a level without a `worldType` | 🪐 |

**Adding a new level (and possibly a new world type):**

1. Set the new level's `worldType` to an existing catalog value when it fits.
2. If the planet is a new archetype, add a value to `WorldType` (`constants/world.ts`) and a matching entry to `WORLD_TYPE_ICON` (`constants/ui.ts`). The icon map is an exhaustive `Record<WorldType, string>`, so TypeScript will not compile a new world type until its icon is supplied — keep this table in sync with that map.
3. The level id (`#NNN`) is derived from the level's numeric `id`; no extra field is needed.

## Level Definitions (Initial 3 Planets)

### Level 1 — Verdania

| Property | Value |
|---|---|
| Name | Verdania |
| World type | `VERDANT` 🌿 |
| Distance | 4.2 light years |
| Gravity | 0.5× |
| Fuel | 1 200 units |
| Electricity | 0 |
| Tools | None |
| Samples | 2 |
| Water zones | None |

Terrain: gently rolling hills with two ample flat landing zones. Scene width = viewport width (no horizontal scroll). Sky: deep indigo → violet gradient. Ground: olive green.

---

### Level 2 — Ferrum

| Property | Value |
|---|---|
| Name | Ferrum |
| World type | `VOLCANIC` 🌋 |
| Distance | 8.7 light years |
| Gravity | 0.9× |
| Fuel | 900 units |
| Electricity | 0 |
| Tools | None |
| Samples | 3 |
| Water zones | 1 lake (hazard — no turbines) |

Terrain: one steep ridge, one wide valley containing the lake. Two sample flat zones on solid ground; one narrow ledge beside the lake for the third. Scene width = 1.5× viewport (camera tracks rover). Sky: burnt orange → deep red. Ground: rust red. Water: dark brown.

If the rover falls into the lake with no turbines and no fuel: stuck with no movement possible → MISSION_FAILED after `STUCK_TIMEOUT_MS`.

---

### Level 3 — Glacius

| Property | Value |
|---|---|
| Name | Glacius |
| World type | `FROZEN` ❄️ |
| Distance | 15.3 light years |
| Gravity | 1.3× |
| Fuel | 1600 units |
| Electricity | 400 units |
| Tools | Water turbines, Laser |
| Samples | 5 (3 on land, 1 underwater, 1 subsurface) |
| Water zones | 2 frozen lakes |

Terrain: jagged ridges with two large lakes. Three land samples on narrow flat zones between ridges. One sample on the floor of the shallower lake (standard landing mechanics apply underwater — the rover must descend gently onto the lake floor at the sample zone using turbines). One subsurface sample buried under the open flat tail: the rover lands on the plateau, fires the laser (`x`) to carve a pit, drops into it and lands gently on the exposed floor to collect it. Scene width = 2× viewport. Sky: pale cyan → ice blue. Ground: white-grey. Water: translucent icy blue.

---

## Level Definitions (Phase 2 — Levels 4–12)

Added in Stage 5 sub-step 4. Each is a single `LevelConfig` object (one file under `lib/levels/`, registered in `lib/levels/index.ts`) using the established terrain DSL (`composeHeightmap`, `segmentStarts`, `segmentCenter`) — no engine changes. Every sample column is the center of a valid flat zone (verified: width ≥ `ROVER_WIDTH`); underwater samples sit on a lake floor below the surface (turbine levels); subsurface samples sit under a flat plateau wide and tall enough for the laser pit (laser levels). Resource budgets are first-pass and tunable after playtest.

| # | Name | World | Gravity | Fuel | Elec | Tools | Samples (land / underwater / subsurface) |
|---|---|---|---|---|---|---|---|
| 4 | Aridus | `DESERT` 🏜️ | 1.0× | 1100 | 0 | — | 3 / 0 / 0 |
| 5 | Caldera | `VOLCANIC` 🌋 | 1.1× | 1000 | 0 | — (lava-lake hazard) | 3 / 0 / 0 |
| 6 | Maris | `OCEANIC` 🌊 | 0.8× | 1300 | 600 | Turbines | 2 / 2 / 0 |
| 7 | Cavus | `BARREN` 🌑 | 1.2× | 1500 | 0 | Laser | 3 / 0 / 1 |
| 8 | Toxina | `TOXIC` ☣️ | 1.0× | 1200 | 500 | Turbines | 3 / 1 / 0 |
| 9 | Crystalis | `CRYSTALLINE` 💎 | 1.3× | 1600 | 450 | Laser + Turbines | 2 / 1 / 1 |
| 10 | Procella | `STORM` 🌩️ | 1.5× | 1500 | 0 | — | 4 / 0 / 0 |
| 11 | Ferrox | `METALLIC` ⚙️ | 1.3× | 1800 | 600 | Laser + Turbines | 2 / 2 / 1 |
| 12 | Terminus | `FROZEN` ❄️ | 1.6× | 2000 | 700 | Laser + Turbines | 2 / 2 / 2 |

Difficulty rises across the set (gravity 1.0→1.6, scene width ~1020→1780, sample count 3→6, tools accumulating). The mechanic focus rotates: pure-flight precision (Aridus, Caldera, Procella), turbine diving (Maris, Toxina), laser excavation (Cavus), and full-toolkit combinations (Crystalis, Ferrox, Terminus). Terminus is the finale.

## i18n Keys Required

```jsonc
// en.json — illustrative; es.json must mirror the exact key set with non-empty values
{
  "game.title": "Space Explorer",

  "levelSelect.title": "Select Mission",
  "levelSelect.locked": "Locked",
  "levelSelect.bestTime": "Best: {{time}}",
  "levelSelect.noTime": "—",
  "levelSelect.congratulations": "Congratulations! You are a true space explorer. Return victorious to Earth!",

  "hud.fuel": "Fuel",
  "hud.electricity": "Electricity",
  "hud.time": "Time",
  "hud.samples": "Samples",
  "hud.gravity": "Gravity",
  "hud.laser": "Laser",
  "hud.turbines": "Turbines",
  "hud.missionReady": "Mission complete — escape now!",

  "mission.failed": "Mission Failed",
  "mission.aborted": "Mission Aborted",
  "mission.abortedHint": "You left the planet without collecting every sample.",
  "mission.escaped": "Mission Complete!",
  "mission.time": "Time: {{time}}",
  "mission.bestTime": "Best: {{time}}",
  "mission.newBest": "New best!",
  "mission.restart": "Restart",
  "mission.exitLevels": "Exit to Missions",

  "pause.title": "Paused",
  "pause.continue": "Continue",
  "pause.restart": "Restart",
  "pause.exitLevels": "Exit to Missions",

  "controls.title": "Controls",
  "controls.left": "← : left thruster (move right)",
  "controls.right": "→ : right thruster (move left)",
  "controls.up": "↑ : main thruster (ascend / brake fall)",
  "controls.mode": "M : toggle thruster / turbine mode",
  "controls.controls": "C : show controls",
  "controls.pause": "ESC : pause",
  "controls.close": "Close",

  "planet.gravity": "{{value}}× gravity",
  "planet.distance": "{{value}} from Earth",

  "nav.language": "Language",
  "nav.theme": "Theme",

  "error.invalidStorage": "Some saved data was invalid and has been reset."
}
```

---

## Frontend Stack

| Concern | Technology |
|---|---|
| Meta-framework | Astro (latest) — SSG |
| UI framework | React (latest) |
| Language | TypeScript (strict) |
| Bundler | Vite (latest, via Astro) |
| Testing | Vitest (latest) |
| i18n | i18next + react-i18next |
| Rendering | HTML5 Canvas 2D for the game scene |
| Node | 24 |

**Architecture:** Layer-based extended with domain folders. The distinct pure-logic domains map cleanly to separate folders alongside the default layers:

```
lib/
├── constants/   # All literals (physics, terrain, storage keys, rover dimensions)
├── physics/     # applyGravity, applyPropulsor, applyTurbine, integratePosition
├── terrain/     # getHeight, isFlatZone, isValidLandingZone, detectTerrainCollision, isUnderwater
├── mission/     # tryCollectSample, isLandingSafe, hasEscaped, updateBestTime
├── levels/      # LevelConfig type + 3 planet definitions
├── progress/    # createInitialProgress, applyCompletion
├── state/       # transitions.ts (pure FSM), useRover.ts (controller)
└── validation/  # localStorage.ts, result.ts
```

The canvas renderer and game loop (`requestAnimationFrame`) live in the components/controller layer. All engine functions are pure (no DOM, no timers, no randomness).

---

## Environment Variables

### `infra/.env`

```
SUBDOMAIN=
DOMAIN_NAME=
HOSTED_ZONE_ID=
CERTIFICATE_ARN=
AWS_ACCOUNT_ID=
AWS_REGION=             # us-east-1
AWS_PROFILE=            # Optional
```

### `frontend/.env`

```
PUBLIC_SITE_URL=
```

---

## Gherkin Feature Specifications

> All scenarios must be defined here before Stage 2 (failing tests) begins. No scenario is added or modified after Stage 2 without developer authorization.

### Feature: Level select

```gherkin
Feature: Level selection screen

  Scenario: Only level 1 is unlocked on first load
    Given the player has no saved progress
    When the level select screen loads
    Then level 1 is shown as available
    And levels 2 and 3 are shown as locked

  Scenario: Completing a level unlocks the next
    Given the player has completed level 1
    When the level select screen loads
    Then level 2 is shown as available
    And level 3 is still locked

  Scenario: Best time shown for completed levels
    Given level 1 has a best time of 95 000 ms
    When the level select screen loads
    Then the formatted time is shown for level 1

  Scenario: Placeholder shown for uncompleted levels
    Given level 2 has never been completed
    When the level select screen loads
    Then "—" is shown for level 2's best time

  Scenario: Completed level can be replayed
    Given level 1 is completed
    When the player selects level 1
    Then the mission starts for level 1
```

### Feature: Rover physics

```gherkin
Feature: Gravity and propulsor forces

  Scenario: Gravity increases downward velocity each frame
    Given the rover is airborne with no thrusters active
    When one physics frame elapses (dt seconds)
    Then vy increases by gravity × EARTH_GRAVITY × dt

  Scenario: Bottom thruster applies upward force
    Given the rover is airborne
    When the bottom thruster is active
    Then vy decreases by PROPULSOR_FORCE × dt

  Scenario: Left thruster applies rightward force
    Given the rover is airborne
    When the left thruster is active
    Then vx increases by PROPULSOR_FORCE × dt

  Scenario: Right thruster applies leftward force
    Given the rover is airborne
    When the right thruster is active
    Then vx decreases by PROPULSOR_FORCE × dt

  Scenario: Multiple thrusters combine forces
    Given the rover is airborne
    When the left and bottom thrusters are both active
    Then vx increases and vy decreases simultaneously

  Scenario: Gravity is cancelled while grounded
    Given the rover is grounded
    When a physics frame elapses with no thrusters active
    Then vy remains 0
```

### Feature: Fuel consumption

```gherkin
Feature: Fuel and electricity resource management

  Scenario: Single active thruster consumes FUEL_CONSUMPTION_RATE per second
    Given the rover has 1 000 fuel
    And only the bottom thruster is active for 1 second
    Then fuel is 1 000 − FUEL_CONSUMPTION_RATE

  Scenario: Two active thrusters consume twice the rate
    Given the rover has 1 000 fuel
    And left and bottom thrusters are both active for 1 second
    Then fuel is 1 000 − 2 × FUEL_CONSUMPTION_RATE

  Scenario: Thrusters cannot fire at 0 fuel
    Given the rover has 0 fuel
    When the player activates any thruster
    Then no force is applied and fuel stays at 0

  Scenario: Propulsor underwater wastes fuel with no thrust
    Given the rover is underwater and in PROPULSOR mode
    When the bottom thruster is activated for 1 second
    Then fuel decreases by FUEL_CONSUMPTION_RATE
    And no upward force is applied

  Scenario: Turbine in atmosphere wastes electricity with no thrust
    Given the rover is in atmosphere and in TURBINE mode
    When the bottom turbine is activated for 1 second
    Then electricity decreases by ELECTRICITY_CONSUMPTION_RATE
    And no upward force is applied
```

### Feature: Landing

```gherkin
Feature: Landing detection

  Scenario: Safe landing on a valid flat zone at low speed
    Given the rover descends toward a flat zone of width ≥ ROVER_WIDTH
    And vy ≤ MAX_LANDING_SPEED
    And |vx| ≤ MAX_LANDING_LATERAL_SPEED
    When the rover's bottom edge contacts the terrain
    Then the rover is grounded safely
    And vx and vy are set to 0

  Scenario: Excessive descent speed destroys the rover
    Given the rover descends toward a flat zone
    And vy > MAX_LANDING_SPEED
    When the rover's bottom edge contacts the terrain
    Then the rover is destroyed
    And the game transitions to MISSION_FAILED

  Scenario: Touching non-flat terrain destroys the rover
    Given the rover descends toward a sloped or irregular terrain column
    When the rover contacts that terrain
    Then the rover is destroyed

  Scenario: Flat zone narrower than ROVER_WIDTH is not a valid landing zone
    Given a flat zone whose width < ROVER_WIDTH
    When the rover attempts to land there
    Then it contacts the terrain edge and is destroyed

  Scenario: Landing at a sample zone collects the sample
    Given the rover lands safely at the flat zone designated for sample S
    Then sample S is marked collected and the counter increments

  Scenario: Safe landing away from a sample zone collects nothing
    Given the rover lands safely on a flat zone with no sample
    Then no sample is collected and the rover is grounded
```

### Feature: Sample collection

```gherkin
Feature: Mission samples

  Scenario: Collecting all samples activates mission-ready status
    Given there are 3 samples on the level
    When the third sample is collected
    Then allSamplesCollected is true
    And the HUD mission-ready indicator activates

  Scenario: Collected samples persist through subsequent takeoffs
    Given the rover has collected 2 of 3 samples and takes off
    Then the collected count remains 2

  Scenario: Already-collected sample cannot be collected again
    Given sample S is already collected
    When the rover lands at sample S's zone again
    Then the count does not change
```

### Feature: Laser and subsurface samples

```gherkin
Feature: Laser terrain mutation and subsurface samples

  Scenario: Firing the laser while grounded carves a pit and spends fuel
    Given the rover is grounded with at least LASER_FUEL_COST fuel
    When the player fires the laser
    Then the LASER_WIDTH columns under the rover are lowered by LASER_DEPTH
    And fuel decreases by LASER_FUEL_COST
    And the rover is no longer grounded

  Scenario: The laser cannot fire while airborne
    Given the rover is airborne
    When the player fires the laser
    Then the terrain is unchanged and no fuel is spent

  Scenario: The laser cannot fire without enough fuel
    Given the rover is grounded with less than LASER_FUEL_COST fuel
    When the player fires the laser
    Then the terrain is unchanged and no fuel is spent

  Scenario: Firing the laser exposes a buried subsurface sample in the beam
    Given a subsurface sample lies within LASER_WIDTH of the rover center
    When the player fires the laser
    Then that sample becomes exposed

  Scenario: A subsurface sample cannot be collected before it is exposed
    Given a subsurface sample that has not been exposed
    When the rover lands on the terrain at its column
    Then the sample is not collected

  Scenario: A subsurface sample is collected by landing on the exposed pit floor
    Given a subsurface sample has been exposed by the laser
    When the rover lands safely on the carved pit floor at its column
    Then the sample is collected

  Scenario: Carving resets when the mission restarts
    Given the player carved terrain with the laser
    When the mission restarts
    Then the terrain returns to its original heightmap
```

### Feature: Escape and abort

```gherkin
Feature: Escape from the planet

  Scenario: Exiting the top edge with all samples completes the level
    Given all samples are collected
    When the rover's top edge exits the top of the scene
    Then the game transitions to ESCAPED
    And level progress is saved
    And best time is updated if better

  Scenario: Exiting the top edge before all samples aborts the mission
    Given at least one sample is not yet collected
    When the rover exits the top edge
    Then the game transitions to MISSION_ABORTED
    And the aborted screen offers Restart and Exit to Missions
    And no progress is saved for this attempt

  Scenario: Restart from the aborted screen resets the mission
    Given the game is in MISSION_ABORTED
    When the player chooses Restart
    Then the mission resets to initial state and transitions to PLAYING

  Scenario: Exit to Missions from the aborted screen goes to level select
    Given the game is in MISSION_ABORTED
    When the player chooses Exit to Missions
    Then the game transitions to LEVEL_SELECT with no progress saved

  Scenario: Best time not affected by abort or failure
    Given level 1 has a best time of 120 000 ms
    When the player aborts the mission
    Then best time remains 120 000 ms

  Scenario: Faster completion updates best time
    Given level 1 has a best time of 120 000 ms
    When the player completes level 1 in 95 000 ms
    Then best time is updated to 95 000 ms

  Scenario: Slower completion does not overwrite best time
    Given level 1 has a best time of 95 000 ms
    When the player completes level 1 in 120 000 ms
    Then best time remains 95 000 ms
```

### Feature: Mission failure

```gherkin
Feature: Mission failure conditions

  Scenario: Unsafe terrain contact transitions to MISSION_FAILED
    Given the rover contacts terrain unsafely
    Then the game transitions to MISSION_FAILED

  Scenario: Rover stuck underwater without turbines fails after timeout
    Given the rover is submerged on level 2 (no turbines) with 0 fuel
    When STUCK_TIMEOUT_MS elapses with no thrust possible
    Then the game transitions to MISSION_FAILED

  Scenario: Rover stranded on the ground without fuel fails after timeout
    Given the rover is grounded on land with 0 fuel
    When STUCK_TIMEOUT_MS elapses with no thrust possible
    Then the game transitions to MISSION_FAILED

  Scenario: Player restarts from MISSION_FAILED
    Given the game is in MISSION_FAILED
    When the player chooses Restart
    Then the mission resets to initial state and transitions to PLAYING

  Scenario: Player exits to level select from MISSION_FAILED
    Given the game is in MISSION_FAILED
    When the player chooses Exit to Missions
    Then the game transitions to LEVEL_SELECT
```

### Feature: Pause menu

```gherkin
Feature: Pause and resume

  Scenario: Escape pauses the game
    Given the game is in PLAYING
    When Escape is pressed
    Then the game transitions to PAUSED and physics stops

  Scenario: Continue resumes the game
    Given the game is in PAUSED
    When Continue is chosen
    Then the game transitions to PLAYING

  Scenario: Restart from pause resets the mission
    Given the game is in PAUSED
    When Restart is chosen
    Then the mission resets and transitions to PLAYING

  Scenario: Exit to Missions from pause goes to level select
    Given the game is in PAUSED
    When Exit to Missions is chosen
    Then the game transitions to LEVEL_SELECT with no progress saved
```

### Feature: Mode switching

```gherkin
Feature: Propulsor / turbine mode switching

  Scenario: M key has no effect on levels without turbines
    Given the rover is on a level without turbines
    When M is pressed
    Then mode remains PROPULSOR

  Scenario: M key toggles mode on levels with turbines
    Given the rover is on level 3 in PROPULSOR mode
    When M is pressed
    Then mode changes to TURBINE

  Scenario: Switching to PROPULSOR while ascending underwater exits water
    Given the rover is underwater in TURBINE mode with the up key held
    When M is pressed to switch to PROPULSOR
    Then the bottom thruster fires and the rover can ascend through the surface

  Scenario: HUD shows active-mode resource
    Given the rover is on level 3
    When in PROPULSOR mode
    Then HUD shows fuel value
    When in TURBINE mode
    Then HUD shows electricity value
```

### Feature: Camera

```gherkin
Feature: Camera tracking

  Scenario: Camera is static on level 1 (scene width = viewport)
    Given level 1
    Then the camera does not pan horizontally

  Scenario: Camera follows rover horizontally on wider levels
    Given level 2 or 3 (scene wider than viewport)
    When the rover moves right
    Then the camera pans right keeping the rover centered
    And panning stops when the rover approaches the scene's right edge

  Scenario: Camera does not scroll vertically
    Given the rover ascends high
    Then the scene does not scroll vertically
    And the rover can pass above the visible area (triggering escape detection)
```

### Feature: Progress persistence

```gherkin
Feature: Progress saved to localStorage

  Scenario: Completing a level saves progress and best time
    Given the player completes level 1 for the first time
    Then space_progress contains level 1 as completed with the elapsed time

  Scenario: Progress survives a page reload
    Given level 2 is completed and saved
    When the page reloads
    Then level 2 is shown as completed with its best time

  Scenario: In-progress state is not saved
    Given the player is mid-mission
    When the page reloads
    Then the player sees the level select screen
    And no in-progress mission is restored
```

### Feature: Last level congratulations

```gherkin
Feature: End-of-game message

  Scenario: Completing the last level shows the congratulations message
    Given level 3 is the last available level
    When the player completes level 3
    Then the ESCAPED screen shows the congratulations message
    And no "next level" button is shown
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
    And the preference is stored in space_prefs

  Scenario: Stored preference is respected on reload
    Given the user previously selected light theme
    When the page reloads
    Then the light theme is applied regardless of system preference
```

### Feature: Language

```gherkin
Feature: Language switcher (English / Spanish)

  Scenario: Default language from browser
    Given the browser language is "es" and no language preference is stored
    When the page loads
    Then Spanish is used for all UI text

  Scenario: User switches language
    When the user selects "English"
    Then all UI text updates to English
    And the preference is stored in space_prefs

  Scenario: Stored language persists on reload
    Given the user previously selected Spanish
    When the page reloads
    Then Spanish is used
```

### Feature: Security — input validation

```gherkin
Feature: Input validation and security

  Scenario: Invalid space_prefs are reset to defaults
    Given corrupted data exists in space_prefs
    When the page loads
    Then the key is reset to defaults and a visible warning is shown

  Scenario: Invalid progress records are discarded individually
    Given space_progress contains one invalid and one valid record
    When the page loads
    Then the invalid record is discarded and the valid record is preserved

  Scenario: Non-array space_progress resets to initial state
    Given space_progress is not an array
    When the page loads
    Then progress resets (only level 1 unlocked) and a visible warning is shown
```

---

## Unit Test Definitions

> Tests are defined here before implementation. No test is written without a definition here.

### Physics (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-PHY-01` | Gravity increases vy by correct delta | `applyGravity(state, dt, gravity)` | `vy += gravity × EARTH_GRAVITY × dt` |
| `T-PHY-02` | Bottom propulsor decreases vy | `applyPropulsor(state, 'BOTTOM', dt)` | `vy -= PROPULSOR_FORCE × dt`; fuel reduced |
| `T-PHY-03` | Left propulsor increases vx | `applyPropulsor(state, 'LEFT', dt)` | `vx += PROPULSOR_FORCE × dt`; fuel reduced |
| `T-PHY-04` | Right propulsor decreases vx | `applyPropulsor(state, 'RIGHT', dt)` | `vx -= PROPULSOR_FORCE × dt`; fuel reduced |
| `T-PHY-05` | Position integrates from velocity | `integratePosition(state, dt)` | `x += vx × dt`; `y += vy × dt` |
| `T-PHY-06` | Propulsor does not fire at 0 fuel | state with `fuel: 0` | velocity unchanged; fuel unchanged |
| `T-PHY-07` | Propulsor consumes `FUEL_CONSUMPTION_RATE × dt` | state with `fuel: 100`, `dt: 1` | `fuel = 100 − FUEL_CONSUMPTION_RATE` |
| `T-PHY-08` | Gravity cancelled when grounded | state with `grounded: true` | vy remains 0 after gravity step |
| `T-PHY-09` | Turbine applies same direction forces as propulsor | `applyTurbine(state, 'BOTTOM', dt)` | Same force applied; electricity reduced |
| `T-PHY-10` | Turbine does not fire at 0 electricity | state with `electricity: 0` | velocity unchanged |
| `T-PHY-11` | Propulsor in water applies no thrust | state `underwater: true`, mode `PROPULSOR` | velocity unchanged; fuel reduced |
| `T-PHY-12` | Turbine in atmosphere applies no thrust | state `underwater: false`, mode `TURBINE` | velocity unchanged; electricity reduced |

### Terrain (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-TER-01` | Height at a column is returned correctly | `getHeight(heightmap, col)` | Correct height value |
| `T-TER-02` | Flat zone detected when consecutive columns share height | `isFlatZone(heightmap, startCol, width)` with equal heights | `true` |
| `T-TER-03` | Non-flat zone not detected as flat | `isFlatZone` with varying heights | `false` |
| `T-TER-04` | Flat zone narrower than `ROVER_WIDTH` is not valid | `isValidLandingZone(heightmap, centerCol, ROVER_WIDTH)` | `false` |
| `T-TER-05` | Collision detected when rover bottom ≤ terrain height | `detectTerrainCollision(rover, heightmap)` | `true` |
| `T-TER-06` | No collision when rover fully above terrain | `detectTerrainCollision` with rover airborne | `false` |
| `T-TER-07` | Underwater state when rover center below water surface | `isUnderwater(rover, waterZones)` | `true` |

### Mission (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-MSN-01` | Landing at sample column collects it | `tryCollectSample(samples, landingColumn)` | Sample `collected: true` |
| `T-MSN-02` | Landing at non-sample column collects nothing | `tryCollectSample(samples, otherColumn)` | No change |
| `T-MSN-03` | Already-collected sample not re-collected | `tryCollectSample([collected], sampleColumn)` | Count unchanged |
| `T-MSN-04` | `allSamplesCollected` true when all collected | all samples `collected: true` | `true` |
| `T-MSN-05` | Unsafe landing speed returns false | `isLandingSafe(vy > MAX, vx)` | `false` |
| `T-MSN-06` | Safe landing speed returns true | `isLandingSafe(vy ≤ MAX, vx ≤ MAX_LAT)` | `true` |
| `T-MSN-07` | Escape detected when rover top exits scene top | `hasEscaped(rover, sceneHeight)` with `rover.position.y < 0` | `true` |
| `T-MSN-08` | Better time replaces existing best | `updateBestTime(120000, 95000)` | `95000` |
| `T-MSN-09` | Slower time does not replace best | `updateBestTime(95000, 120000)` | `95000` |
| `T-MSN-10` | Any time replaces null best | `updateBestTime(null, 80000)` | `80000` |

### Laser (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-LAS-01` | Beam columns lowered by `LASER_DEPTH` | `fireLaser(heightmap, centerCol)` | the `LASER_WIDTH` columns centered on `centerCol` each drop by `LASER_DEPTH` |
| `T-LAS-02` | Columns outside the beam are unchanged | `fireLaser(heightmap, centerCol)` | columns beyond the beam keep their height |
| `T-LAS-03` | Lowered height clamps at 0 | `fireLaser` on shallow terrain | no column goes below 0 |
| `T-LAS-04` | Input heightmap is not mutated | `fireLaser(heightmap, centerCol)` | a new array is returned; the input is unchanged |
| `T-LAS-05` | Subsurface sample in the beam is exposed | `exposeSubsurfaceSamples(samples, centerCol)` | matching subsurface sample → `exposed: true` |
| `T-LAS-06` | Sample outside the beam stays unexposed | `exposeSubsurfaceSamples(samples, farCol)` | far subsurface sample unchanged |
| `T-LAS-07` | Surface (non-subsurface) sample is untouched | `exposeSubsurfaceSamples(samples, centerCol)` | surface sample unchanged |

### Progress (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-PRG-01` | Initial progress unlocks only level 1 | `createInitialProgress(levels)` | Level 1 unlocked; rest locked |
| `T-PRG-02` | Completing level N unlocks N+1 | `applyCompletion(progress, 1, 80000)` | Level 2 unlocked |
| `T-PRG-03` | First completion records best time | `applyCompletion` with `bestTimeMs: null` | `bestTimeMs: 80000` |
| `T-PRG-04` | Better time updates best | `applyCompletion` with `bestTimeMs: 80000`, new time 60000 | `bestTimeMs: 60000` |
| `T-PRG-05` | Slower time does not update best | `applyCompletion` with `bestTimeMs: 80000`, new time 100000 | `bestTimeMs: 80000` |
| `T-PRG-06` | Completing the last level unlocks nothing new | `applyCompletion(progress, lastId, time)` | No new level added |

### State transitions (pure)

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-ST-01` | LEVEL_SELECT → PLAYING on level selected | `transition(LEVEL_SELECT, 'SELECT_LEVEL', levelId)` | `status: PLAYING` |
| `T-ST-02` | PLAYING → PAUSED | `transition(PLAYING, 'PAUSE')` | `status: PAUSED` |
| `T-ST-03` | PAUSED → PLAYING on continue | `transition(PAUSED, 'CONTINUE')` | `status: PLAYING` |
| `T-ST-04` | PAUSED → PLAYING on restart (state reset) | `transition(PAUSED, 'RESTART')` | `status: PLAYING`; mission reset |
| `T-ST-05` | PAUSED → LEVEL_SELECT on exit | `transition(PAUSED, 'EXIT')` | `status: LEVEL_SELECT` |
| `T-ST-06` | PLAYING → MISSION_FAILED on destroy | `transition(PLAYING, 'DESTROY')` | `status: MISSION_FAILED` |
| `T-ST-07` | PLAYING → ESCAPED when all samples collected | `transition(PLAYING, 'ESCAPE')` with `allSamplesCollected: true` | `status: ESCAPED` |
| `T-ST-08` | PLAYING → MISSION_ABORTED when aborting | `transition(PLAYING, 'ESCAPE')` with `allSamplesCollected: false` | `status: MISSION_ABORTED` |
| `T-ST-09` | MISSION_FAILED → PLAYING on restart | `transition(MISSION_FAILED, 'RESTART')` | `status: PLAYING`; mission reset |
| `T-ST-10` | MISSION_FAILED → LEVEL_SELECT on exit | `transition(MISSION_FAILED, 'EXIT')` | `status: LEVEL_SELECT` |
| `T-ST-11` | ESCAPED → LEVEL_SELECT on continue | `transition(ESCAPED, 'CONTINUE')` | `status: LEVEL_SELECT` |
| `T-ST-12` | MISSION_ABORTED → PLAYING on restart | `transition(MISSION_ABORTED, 'RESTART')` | `status: PLAYING`; mission reset |
| `T-ST-13` | MISSION_ABORTED → LEVEL_SELECT on exit | `transition(MISSION_ABORTED, 'EXIT')` | `status: LEVEL_SELECT` |

### localStorage validation

| Test ID | Objective | Input | Expected output |
|---|---|---|---|
| `T-LS-01` | Valid `space_prefs` passes | `{ language: "en", theme: "dark" }` | Parsed object returned |
| `T-LS-02` | Invalid theme value fails | `{ language: "en", theme: "blue" }` | Error result; defaults applied |
| `T-LS-03` | Tampered JSON resets | `"{{not json}}"` | Error result; defaults applied |
| `T-LS-04` | Valid `space_progress` array passes | `[{ levelId: 1, completed: true, bestTimeMs: 80000 }]` | Parsed array |
| `T-LS-05` | Invalid record discarded | array with one record missing `levelId` | Invalid discarded; valid preserved |
| `T-LS-06` | Non-array `space_progress` resets | `"not array"` | Error result; empty progress applied |

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

**Scope:** Deploy AWS infrastructure. No frontend code.

**Deliverables:**

- `infra/bin/app.ts` consuming `GameStack` from `@arcade/infra` with `STACK_ID = 'SpaceExplorerStack'`
- `infra/.env.example`
- `infra/cdk.json`
- `infra/readme.md`

**Validation:** `npm --prefix space-explorer/infra run typecheck` passes. Developer runs `cdk deploy` and confirms subdomain resolves.

---

### Stage 2 — Failing tests

**Scope:** Write all unit tests defined in this spec. All must fail (no implementation exists).

**Files created:**

- `frontend/src/lib/physics/__tests__/physics.test.ts` — T-PHY-*
- `frontend/src/lib/terrain/__tests__/terrain.test.ts` — T-TER-*
- `frontend/src/lib/mission/__tests__/mission.test.ts` — T-MSN-*
- `frontend/src/lib/progress/__tests__/progress.test.ts` — T-PRG-*
- `frontend/src/lib/state/__tests__/transitions.test.ts` — T-ST-*
- `frontend/src/lib/validation/__tests__/localStorage.test.ts` — T-LS-*
- `frontend/src/i18n/__tests__/i18n.test.ts` — T-I18N-*
- `frontend/src/lib/laser/__tests__/laser.test.ts` — T-LAS-* (added in Stage 5 sub-step 2)

**Constraints:** No implementation files created. Running `vitest` must report all tests as failing.

---

### Stage 3 — Implementation (Phase 1: base game)

**Scope:** All application code making Stage 2 tests pass, plus the full UI. Advanced tools (laser, full turbine mechanics) are excluded.

**Order within this stage:**

1. Constants and enums (`GameStatus`, `PropulsorMode`, rover dimensions, physics constants, terrain constants, storage keys)
2. Level configurations — `levels/` module: `LevelConfig` type + 3 planet definitions (Verdania, Ferrum, Glacius)
3. i18n — `en.json`, `es.json`, i18next config
4. localStorage validation layer
5. Physics — `applyGravity`, `applyPropulsor`, `applyTurbine` (turbine logic is correct but level 1–2 configs have electricity = 0, effectively disabled), `integratePosition` — pure
6. Terrain — `getHeight`, `isFlatZone`, `isValidLandingZone`, `detectTerrainCollision`, `isUnderwater` — pure
7. Mission — `tryCollectSample`, `isLandingSafe`, `hasEscaped`, `updateBestTime` — pure
8. Progress — `createInitialProgress`, `applyCompletion` — pure
9. State transitions — `transition` (pure FSM) + `useRover` React controller (game loop via `requestAnimationFrame`, input handling, stuck-timeout logic, localStorage side effects)
10. Canvas renderer — `GameCanvas`: sky gradient, terrain heightmap polygon, water zone fills, rover rectangle with thruster flame animations, sample markers, camera horizontal transform
11. React components: `LevelSelectScreen`, `HUD` (sidebar stats), `PauseMenu`, `MissionResult`, `ControlsOverlay`, `ThemeToggle`, `LanguageToggle`, `App`
12. Astro page and layout
13. CSS — space palette, both themes, responsive canvas

**After each sub-step: run `vitest`. Proceed only when all tests for that sub-step pass.**

---

### Stage 4 — Documentation

**Scope:** Complete all documentation. No code changes.

**Deliverables:**

- `space-explorer/spec.md` — finalize decisions log
- `space-explorer/claude.md`
- `space-explorer/readme.md`

---

### Stage 5 — Phase 2: Advanced tools (future; requires separate authorization)

**Scope:** Laser and water turbine full mechanics, deferred from Stage 3.

**Sub-steps (broken into their own stages when authorized):**

1. ✅ **Done (2026-06-30).** Water turbines: `applyTurbine` already correct — enabled on level 3, with verified underwater physics, `m`-key mode switching, the TURBINE→PROPULSOR surface-break, electricity depletion, and the stuck-timeout behavior in turbine-capable levels. Glacius's underwater sample (`glacius-4`) is restored. Wiring is controller-side (`useRover`); no pure-engine test changed.
2. ✅ **Done (2026-06-30).** Subsurface samples: the `x` laser fires while grounded for `LASER_FUEL_COST` fuel, lowers a `LASER_WIDTH` beam by `LASER_DEPTH` in a mission-owned working heightmap, and exposes any subsurface sample in the beam; the rover drops into the pit and lands on the exposed floor to collect it. Added Glacius's subsurface sample (`glacius-5`). New pure module `lib/laser/` with `T-LAS-*` tests.
3. ✅ **Done.** New test definitions (`T-LAS-01..07`) for laser terrain mutation and sample exposure were added to this spec and implemented as failing tests before the `lib/laser/` code. Turbine wiring (sub-step 1) needed no new pure tests — its physics (`applyTurbine`) was already covered by `T-PHY-09..12`.
4. ✅ **Done (2026-06-30).** Levels 4–12: added 9 more planet configurations (Aridus, Caldera, Maris, Cavus, Toxina, Crystalis, Procella, Ferrox, Terminus) using the established `LevelConfig` schema — no engine changes. Seven new world types + icons were added. See "Level Definitions (Phase 2 — Levels 4–12)".

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-29 | Canvas 2D rendering for the play scene | Physics-based game with continuous animation, terrain drawing, and thruster flame effects. Per-frame DOM updates would be prohibitively expensive |
| 2026-06-29 | Heightmap (array of integer heights per column) for terrain | Simplest structure for collision, flat-zone detection, and level authoring. Easy to hand-craft per level; straightforward to extend. Chosen over splines (harder to edit) and SVG path (harder collision math) |
| 2026-06-29 | Camera follows rover horizontally only; scene height is fixed | Horizontal scrolling only when scene is wider than viewport. No vertical scroll: the escape condition is the rover exiting the top edge of the fixed-height scene |
| 2026-06-29 | Manual propulsor / turbine mode switching via `m` | Adds a deliberate skill element and keeps the physics loop simple. Auto-switching on water entry was considered but removed — the manual toggle matches the difficulty intent and avoids implicit state changes |
| 2026-06-29 | Wrong mode in wrong environment wastes resource with no thrust | Consistent consequence for incorrect mode use; makes mode awareness consequential without being instantly lethal |
| 2026-06-29 | Exiting the top edge before all samples = abort; return to level select, no save | Qualitatively different from mission completion; matches "tendrá que reiniciarla" in the game bases. Abort is a neutral outcome (no failure screen, no progress update) |
| 2026-06-29 | Best time updated only on successful escape and only if better | Failure and abort must not corrupt an established best time. Slower successful runs also leave the best time intact |
| 2026-06-29 | Level 2 lake without turbines is a hazard, not instant death | Rover survives submersion; mission fails after `STUCK_TIMEOUT_MS` with 0 fuel and 0 electricity. Gives the player a moment to understand what happened before MISSION_FAILED appears |
| 2026-06-29 | Fuel and electricity are separate resources | Fuel = atmosphere propulsion; electricity = underwater propulsion. Different origins, different depletion curves per level. HUD shows only the active-mode resource to avoid cognitive overload |
| 2026-06-29 | Advanced tools (laser, full turbine mechanics) deferred to Phase 2 | Core game (physics, terrain, samples, escape, progression) must be validated before adding mechanics that mutate terrain or introduce a full second physics mode. Phase 2 requires separate authorization |
| 2026-06-29 | 3 planets defined; architecture is config-driven to support any number | Developer confirmed starting with 3 levels. All level data lives in `LevelConfig[]`; adding a planet requires only a new config object — zero engine changes |
| 2026-06-29 | Layer-based architecture extended with physics/, terrain/, mission/, levels/, progress/ | Distinct pure-logic domains map cleanly to separate folders. Fully feature-based layout was considered unnecessary at this scope |
| 2026-06-29 | In-progress GameState is never persisted | Page refresh returns to level select. Only preferences and level progress (completion + best time) are stored. Consistent with the monorepo pattern established by Snake |
| 2026-06-29 | Fixed `SCENE_HEIGHT` bridges the two coordinate frames; `1 column = 1 game unit` | Rover positions are measured from the top of the scene (data model); heightmap/water heights from the bottom (data model). A single fixed `SCENE_HEIGHT` reconciles them, so `detectTerrainCollision(rover, heightmap)` and `isUnderwater(rover, waterZones)` keep their two-argument signatures and read the constant internally. One column equals one horizontal game unit, so `ROVER_WIDTH` doubles as a column count |
| 2026-06-29 | `transition` carries the `LevelConfig` for `SELECT_LEVEL` / `RESTART`; unlock status is derived, not stored | Rebuilding the mission (rover fuel, spawn) on select/restart needs the level data, so it is passed as the third argument; `CONTINUE` is status-dependent (PAUSED→PLAYING, ESCAPED→LEVEL_SELECT). Unlocking is computed by `isLevelUnlocked(progress, levelId)` (level 1, or previous completed) rather than stored on `LevelProgress` |
| 2026-06-29 | Sample collection uses a controller-side reach tolerance; the pure rule stays exact-match | `tryCollectSample(samples, column)` matches the sample's flat-zone center exactly (testable, deterministic). The controller maps a safe landing to the nearest uncollected sample within `ROVER_WIDTH / 2`, so landing anywhere on the zone collects it without weakening the pure function's contract |
| 2026-06-29 | Phase 1 controller is propulsor-only; `applyTurbine` is implemented but unwired | The pure `applyTurbine` is written (it is unit-tested) and Glacius ships with its turbine flags and underwater sample as data, but no turbine/laser controller wiring or `m`-key mode switching is added in Phase 1. Consequently Glacius's underwater sample is gated until Phase 2 (Stage 5), honoring "the core game ships without advanced tools" |
| 2026-06-29 | Rendering at 1 game unit = 1 px with a horizontal-only camera | The canvas is `960×600` px; the camera offset is `0` when the scene fits the viewport (Verdania, static) and tracks the rover otherwise (Ferrum, Glacius), clamped at the scene edges. No vertical scroll — escape is the rover leaving the top edge |
| 2026-06-29 | Level cards show a `worldType` icon + `#NNN` id; locked cards show a 🔒 icon | A per-level `worldType` (optional on the type, set by every bundled level) maps to an icon via an exhaustive `Record<WorldType, string>`, so a new world type cannot compile without an icon. The numeric `id` renders as zero-padded `#NNN`. `worldType` is optional only so the Stage-2 test fixtures stay untouched; a level without one falls back to 🪐 |
| 2026-06-29 | Abort now has its own `MISSION_ABORTED` state and screen (supersedes the earlier "abort is a neutral outcome, no screen") | Exiting the top edge without all samples no longer drops silently to the level select. It transitions to `MISSION_ABORTED`, which shows a modal titled "Mission Aborted" with **Restart** and **Exit to Missions** (same shape as the failure screen, distinct title). Still no progress saved and best time untouched. `transition(PLAYING, 'ESCAPE')` now branches to `MISSION_ABORTED` instead of `LEVEL_SELECT` (T-ST-08 updated; T-ST-12/13 added) |
| 2026-06-29 | Grounded on land with 0 fuel is a stranded-failure after `STUCK_TIMEOUT_MS` | A rover at rest on land with no fuel can never thrust again — it can neither take off nor escape. Rather than leaving the player trapped, the controller treats it like the submerged-stuck case and fails the mission after the same timeout. Detection is controller-side (time-based), mirroring the existing underwater-stuck check |
| 2026-06-30 | Stage 5 sub-step 1 (water turbines) implemented; Glacius underwater sample restored | Turbine physics (`applyTurbine`) was already unit-tested; this wires it through `useRover`: `m` toggles mode on turbine levels, the active mode selects propulsor vs. turbine thrust, ungrounding now checks the active-mode resource (electricity in turbine mode), and the stuck-timeout also fires when submerged on a turbine level with 0 electricity. The TURBINE→PROPULSOR surface-break is implemented in the controller by momentarily treating the rover as surfaced for one `applyPropulsor` step (reusing the tested pure function), so no new pure function or unit test was added — keeping the locked test suite untouched. `glacius-4` (lake-A floor, `subsurface: false`) is back in the samples list. Laser/subsurface (sub-step 2) and levels 4–12 (sub-step 4) remain deferred |
| 2026-06-30 | Stage 5 sub-step 4 (levels 4–12) added | Nine new planets shipped as pure `LevelConfig` data (one file each, registered in `lib/levels/index.ts`), with seven new `WorldType` values + icons (`DESERT`, `OCEANIC`, `TOXIC`, `CRYSTALLINE`, `BARREN`, `STORM`, `METALLIC`) — the exhaustive `WORLD_TYPE_ICON` map forces an icon per type at compile time. No engine, controller, test, or i18n changes (level names are proper nouns held in the config, not translated). Terrain authored with the existing DSL so every sample column stays pinned to a valid flat-zone center; a one-off data check confirmed all 12 levels (samples on valid landing zones, underwater samples under water on turbine levels, subsurface samples laser-capable with pit clearance, spawn always over land). Resource budgets are first-pass, tunable after playtest |
| 2026-06-30 | Opening the controls overlay pauses the mission | Reading the controls while the rover keeps falling was unfair, so showing the overlay (via `c` or the `?` button) now pauses an active mission and closing it resumes. A `pausedByControlsRef` flag scopes the auto-resume to the overlay: opening controls from the pause menu leaves the game paused and returns to the pause menu on close. The pause menu is suppressed while the overlay is open so the two modals never stack, and `c` is now gated to in-mission (matching its long-documented "during a mission" intent and the `?` button). Controller-side only (`App.tsx`); no engine/state/test changes |
| 2026-06-30 | Modal primary buttons receive focus on open so `Enter` confirms them | The primary action of each overlay (PauseMenu "Continue", MissionResult "Continue"/"Restart", ControlsOverlay "Close") is `autoFocus`ed when the modal opens. A focused `<button>` activates natively on `Enter` (and `Space`), so no global key listener is added and the keyboard surface is unchanged; it also moves focus into the dialog, improving accessibility. Purely presentational — no controller, engine, or test changes |
| 2026-06-30 | Ascend (bottom thruster) rebound from `ArrowUp` to `ArrowDown` | Makes the control scheme physically consistent: every arrow key now points where the thruster's jet fires and the rover reacts the opposite way (action/reaction), matching the already-established lateral convention (`←` fires the left jet → moves right; `→` fires the right jet → moves left). The bottom thruster fires its jet downward, so `↓` now drives ascent. Pure binding change in `useRover` (keyboard map + surface-break check), `GameCanvas` flame listener, the `TouchControls` main-thruster button (glyph `▲`→`▼`), and the `controls.up` i18n string (`↑`→`↓`) in both languages. No engine, state, or test changes — bindings live only in the controller/UI, so the locked pure-engine suite is untouched |
| 2026-06-30 | Stage 5 sub-step 2 (laser + subsurface samples) implemented | The `x` laser fires only while grounded and spends `LASER_FUEL_COST` fuel; it lowers a `LASER_WIDTH`-column beam under the rover by `LASER_DEPTH` and exposes any subsurface sample in the beam, then ungrounds the rover so it drops into the pit. Terrain mutation lives on a **mission-owned working heightmap** carried in `GameState.heightmap` (optional, so the locked `transitions` fixtures stay valid): copied from the immutable `LevelConfig.heightmap` at mission start and rebuilt on restart, so carving never leaks into the shared level data and resets cleanly. New pure module `lib/laser/` (`fireLaser`, `exposeSubsurfaceSamples`) with `T-LAS-01..07`. Collection gating is controller-side: a subsurface sample is collectible only once `exposed`, mirroring the existing reach-tolerance approach, so `tryCollectSample` stays untouched. `SampleState.exposed?` is optional for the same test-compatibility reason. Laser key is `x` and the shot costs fuel (developer-chosen); Glacius fuel bumped 1200→1600 to keep the 5-sample run completable |
