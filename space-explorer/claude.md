# claude.md — space-explorer

Game-specific working instructions for Claude Code. This game inherits the monorepo contract: read the root [`spec.md`](../spec.md), the root [`claude.md`](../claude.md), and this game's [`spec.md`](spec.md) before acting on any prompt. Where documents disagree, the monorepo `spec.md` wins unless a deviation is declared in `space-explorer/spec.md`.

---

## Overview

`space-explorer` is a physics-based 2D planetary mission game.

- Pilot a rover that moves **only through its thrusters** — there is no wheeled ground movement. Descend through the atmosphere against gravity and limited fuel, land gently on flat zones to collect mineral samples, then escape by firing upward off the top of the scene.
- Land safely only when contact is within a valid flat zone (width ≥ `ROVER_WIDTH`, rover centered), `vy ≤ MAX_LANDING_SPEED`, and `|vx| ≤ MAX_LANDING_LATERAL_SPEED`. Any other terrain contact destroys the rover.
- Three thrusters (left → pushes right, right → pushes left, bottom → up) may fire together; each costs `FUEL_CONSUMPTION_RATE` fuel/s. Propulsors only thrust in the atmosphere.
- Escape with **all** samples → level complete (best time saved if better). Exit the top with samples missing → **abort** (its own `MISSION_ABORTED` screen, no save). Unsafe contact, or being stranded with no fuel past `STUCK_TIMEOUT_MS` (on land, or submerged on a turbine-less level) → **mission failed**.
- 12 config-driven planets (Verdania, Ferrum, Glacius, Aridus, Caldera, Maris, Cavus, Toxina, Crystalis, Procella, Ferrox, Terminus), unlocked sequentially. Bilingual (English / Spanish), light/dark theme.
- Static frontend only — **no backend**.

### Phase boundaries (important)

- **Phase 1 (Stages 1–4, shipped):** propulsor flight, terrain/landing, samples, escape/abort, progression, full UI. **Propulsor-only.**
- **Phase 2 sub-step 1 (Stage 5, shipped 2026-06-30):** water turbines fully wired — `m`-key mode switching, mode-selected thrust (turbine underwater / propulsor in atmosphere), active-mode resource gating on ungrounding, the TURBINE→PROPULSOR surface-break, turbine-jet rendering, the turbine-level stuck-timeout, and Glacius's restored underwater sample (`glacius-4`).
- **Phase 2 sub-step 2 (Stage 5, shipped 2026-06-30):** the `x` laser and subsurface samples — fired while grounded for `LASER_FUEL_COST` fuel, it lowers a `LASER_WIDTH` beam by `LASER_DEPTH` in a mission-owned working heightmap (`GameState.heightmap`, copied from the level, reset on restart) and exposes any subsurface sample in the beam (`SampleState.exposed`); collection is gated controller-side on exposure. New pure module `lib/laser/` (`fireLaser`, `exposeSubsurfaceSamples`, `T-LAS-*`). Glacius carries its subsurface sample (`glacius-5`). The pure engine's locked tests were untouched — both new state fields are optional to keep the `transitions`/`mission` fixtures valid.
- **Phase 2 sub-step 4 (Stage 5, shipped 2026-06-30):** levels 4–12 — nine new planets as pure `LevelConfig` data (Aridus, Caldera, Maris, Cavus, Toxina, Crystalis, Procella, Ferrox, Terminus), plus seven new `WorldType` values + icons. No engine/controller/test/i18n changes. **Stage 5 (Phase 2) is now complete.**

---

## Working style (game-specific notes)

All monorepo rules apply (spec-first, stage discipline, no magic values, English code, i18n-only UI strings, input validation, security). In addition:

- **Tests are the contract and are locked.** The unit tests under `frontend/src/**/__tests__/` were written in Stage 2 and define the public API of the logic layers (`T-PHY`, `T-TER`, `T-MSN`, `T-PRG`, `T-ST`, `T-LS`, `T-I18N`). Do not add or modify a test without explicit developer authorization; if a feature needs a new test, add its definition to `spec.md` first.
- **The engine is pure and deterministic.** Every function in `physics/`, `terrain/`, `mission/`, `progress/`, and `state/transitions.ts` returns a new value from its inputs — no DOM, no timers, no randomness. `dt` (seconds) is always injected by the caller, never read from a clock inside the engine. Keep it that way.
- **`useRover` (the `useGame` hook) is the only bridge between logic and React.** The `requestAnimationFrame` loop, keyboard/touch input, the stuck-timeout, camera-independent state, and all `localStorage` side effects live there — not in components or the pure modules.
- **Game logic never lives in components.** Components render state and call the controller. `GameCanvas` is presentation: it reads `state` + `level` and draws; it computes no rules. (Its view-only key listener exists solely to animate thruster flames.)
- **i18n key sets stay identical.** `en.json` and `es.json` must always have the same keys with non-empty values (guarded by `T-I18N-01/02`). Add new keys to both.

---

## Coordinate & unit conventions

- **Vertical:** rover `position` is the top-left corner measured **from the top** of the scene; `positive y = downward`. Heightmap heights and water `surfaceHeight` are measured **from the bottom**. The fixed `SCENE_HEIGHT` constant reconciles the two — this is why `detectTerrainCollision` / `isUnderwater` need no scene-height argument.
- **Horizontal:** `1 heightmap column = 1 game unit`. `ROVER_WIDTH` is therefore both a width in units and a span in columns.
- **Rendering:** `1 game unit = 1 px` on a `960×600` canvas; the camera pans horizontally only, clamped to the scene, and is static when the scene fits the viewport. No vertical scroll — escape = rover top crossing `y < 0`.

---

## Directory map

```
space-explorer/
├── spec.md                 # Game contract — source of truth for space-explorer
├── claude.md               # This file
├── readme.md               # Local dev / test / deploy guide
├── frontend/
│   └── src/
│       ├── components/      # React UI only: App, GameCanvas, HUD, LevelSelectScreen,
│       │                    #   PauseMenu, MissionResult, ControlsOverlay,
│       │                    #   ThemeToggle, LanguageToggle, TouchControls,
│       │                    #   usePrefs (prefs hook), format (time helper)
│       ├── i18n/            # en.json, es.json, config.ts (i18next setup)
│       ├── layouts/         # Layout.astro
│       ├── pages/           # index.astro (renders <App client:only="react" />)
│       ├── styles/          # global.css (space palette, both themes)
│       └── lib/
│           ├── constants/   # game, scene, rover, physics, mission, laser, storage,
│           │                #   preferences, validation, world, samples, ui — all literals here
│           ├── physics/     # physics.ts: applyGravity, applyPropulsor,
│           │                #   applyTurbine, integratePosition (pure)
│           ├── terrain/     # terrain.ts: getHeight, isFlatZone, isValidLandingZone,
│           │                #   detectTerrainCollision, isUnderwater (pure)
│           ├── laser/       # laser.ts: fireLaser, exposeSubsurfaceSamples (pure)
│           ├── mission/     # mission.ts: tryCollectSample, allSamplesCollected,
│           │                #   isLandingSafe, hasEscaped, updateBestTime (pure)
│           ├── levels/      # types, builder (terrain DSL), 3 planet configs, index
│           ├── progress/    # progress.ts: createInitialProgress, applyCompletion,
│           │                #   isLevelUnlocked (pure)
│           ├── state/       # transitions.ts (pure FSM + mission-state factory),
│           │                #   useRover.ts (the useGame controller)
│           └── validation/  # localStorage.ts (validatePrefs/validateProgress), result.ts
└── infra/                   # CDK app (GameStack) — see infra/readme.md
```

Architecture is **layer-based extended with domain folders** (the spec's declared choice): `physics/`, `terrain/`, `laser/`, `mission/`, `levels/`, `progress/` alongside the default `state/` / `validation/`.

---

## How to modify game rules or add a feature

1. **Update `spec.md` first.** Add or change the relevant Gherkin scenario and, if logic is affected, the unit-test definition. Log the decision in the Decisions Log. Get developer authorization (stage discipline still applies).
2. **Adjust/extend tests** (only with authorization) to cover the new behavior.
3. **Implement in the logic layer** (`physics/`, `terrain/`, `laser/`, `mission/`, `progress/`, `state/transitions`, `validation/`) as pure functions; keep every literal in `lib/constants/`.
4. **Wire it through `useRover`** (`lib/state/useRover.ts`), then surface it in components.
5. **Add any new UI strings** to both `i18n/en.json` and `i18n/es.json`.
6. **Validate:** `npm run test --workspace space-explorer/frontend`, then `npm run typecheck --workspace space-explorer/frontend`, then `npm run build --workspace space-explorer/frontend`.

To add a planet (Phase 2), add one `LevelConfig` object under `lib/levels/` and register it in `lib/levels/index.ts` — no engine changes. Use `builder.ts` (`composeHeightmap`, `segmentCenter`) so sample columns stay pinned to flat-zone centers. Set the level's `worldType` (drives the level-select icon): reuse an existing value from `constants/world.ts`, or add a new `WorldType` plus its entry in `WORLD_TYPE_ICON` (`constants/ui.ts`) — that map is an exhaustive `Record<WorldType, string>`, so a new world type will not compile without an icon. The level id renders as `#NNN` (zero-padded) from the numeric `id`; locked levels show a 🔒 icon. See `spec.md` → "World Types & Level-Select Display" for the catalog.

If a change contradicts an existing scenario or decision, stop, update the documentation first, then change the code.

### Key invariants to preserve

- The engine stays pure and `dt`-driven (no `Date`/`performance.now` inside `physics`/`terrain`/`laser`/`mission`/`progress`). Wall-clock time lives only in `useRover`.
- Propulsors thrust only in atmosphere; turbines only underwater. Using the wrong one wastes the resource and produces no force.
- The laser mutates only the mission-owned `GameState.heightmap` (a copy), never `LevelConfig.heightmap`; carving resets on restart. A subsurface sample is collectable only once `exposed`.
- Best time updates **only** on successful escape and **only** when strictly better; failure and abort never touch it.
- Every sample's `columnIndex` is the center of a valid flat zone (width ≥ `ROVER_WIDTH`); for a subsurface sample that zone is the carved pit floor.
- The in-progress `GameState` is never persisted; only `space_prefs` and `space_progress` are.

---

## Security checklist

- [ ] `space_prefs` and `space_progress` parsed through `validatePrefs` / `validateProgress`; invalid prefs reset to defaults, invalid progress records are discarded individually (non-array resets all), and a visible warning banner is shown.
- [ ] No `innerHTML`, `eval`, `new Function`, or `document.write`. All DOM output goes through React (text nodes) or the canvas 2D API.
- [ ] All input is bounded and validated: `localStorage` via the validation layer; keyboard/touch map only to fixed actions (Arrows, `Escape`, `c`); URL params are not consumed.
- [ ] CSP and security headers are served by `GameStack`'s `ResponseHeadersPolicy` (CloudFront). Revisit the CSP if the build ever emits inline scripts.
- [ ] No domains, URLs, or account values in source — only in `.env` (see `infra/.env.example`, `frontend/.env.example`).
