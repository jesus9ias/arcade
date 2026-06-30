// Mission controller: the only bridge between the pure engine and React. Owns the
// requestAnimationFrame loop, keyboard input, the stuck-timeout, localStorage
// progress persistence and best-time bookkeeping. All rules live in the pure
// modules; this file only wires them to time, input and storage.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GameStatus,
  PropulsorMode,
  ThrusterDirection,
  STORAGE_KEYS,
  STUCK_TIMEOUT_MS,
  LASER_FUEL_COST,
  ROVER_WIDTH,
  ROVER_HEIGHT,
  SCENE_HEIGHT,
} from '../constants';
import type { GameState, RoverState, ThrusterDirection as ThrusterDir } from '../constants';
import type { LevelConfig } from '../levels';
import { LEVELS } from '../levels';
import {
  applyGravity,
  applyPropulsor,
  applyTurbine,
  integratePosition,
} from '../physics/physics';
import { fireLaser, exposeSubsurfaceSamples } from '../laser/laser';
import {
  detectTerrainCollision,
  getHeight,
  isUnderwater,
  isValidLandingZone,
} from '../terrain/terrain';
import {
  allSamplesCollected,
  hasEscaped,
  isLandingSafe,
  tryCollectSample,
} from '../mission/mission';
import {
  applyCompletion,
  createInitialProgress,
  type LevelProgress,
} from '../progress/progress';
import { validateProgress } from '../validation/localStorage';
import {
  createLevelSelectState,
  createMissionState,
  transition,
} from './transitions';

/** Maximum physics step (s). Guards against huge dt after a tab is backgrounded. */
const MAX_DT = 1 / 30;

export interface MissionResultData {
  timeMs: number;
  bestTimeMs: number;
  isNewBest: boolean;
}

export interface UseGame {
  state: GameState;
  level: LevelConfig | null;
  progress: LevelProgress[];
  result: MissionResultData | null;
  warning: string | null;
  selectLevel: (level: LevelConfig) => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  exit: () => void;
  dismissWarning: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function loadProgress(): { progress: LevelProgress[]; warning: boolean } {
  if (typeof localStorage === 'undefined') {
    return { progress: createInitialProgress(LEVELS), warning: false };
  }
  const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
  if (raw === null) return { progress: createInitialProgress(LEVELS), warning: false };
  const result = validateProgress(raw);
  if (!result.ok) {
    return { progress: createInitialProgress(LEVELS), warning: true };
  }
  // Merge stored records onto the canonical level list so new levels appear.
  const base = createInitialProgress(LEVELS);
  const merged = base.map((record) => {
    const stored = result.value.find((r) => r.levelId === record.levelId);
    return stored ?? record;
  });
  return { progress: merged, warning: false };
}

function saveProgress(progress: LevelProgress[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
}

/** Column nearest the rover center that holds a collectable uncollected sample,
 *  if within reach. Subsurface samples count only once the laser has exposed them. */
function landingSampleColumn(
  state: GameState,
  centerColumn: number,
): number {
  const reach = ROVER_WIDTH / 2;
  const hit = state.samples.find(
    (sample) =>
      !sample.collected &&
      (!sample.subsurface || sample.exposed) &&
      Math.abs(sample.columnIndex - centerColumn) <= reach,
  );
  return hit ? hit.columnIndex : centerColumn;
}

export function useGame(): UseGame {
  const initial = loadProgress();
  const [state, setState] = useState<GameState>(createLevelSelectState);
  const [progress, setProgress] = useState<LevelProgress[]>(initial.progress);
  const [result, setResult] = useState<MissionResultData | null>(null);
  const [warning, setWarning] = useState<string | null>(
    initial.warning ? 'error.invalidStorage' : null,
  );

  // Mutable loop state, kept out of React render cycles.
  const stateRef = useRef<GameState>(state);
  const levelRef = useRef<LevelConfig | null>(null);
  const progressRef = useRef<LevelProgress[]>(initial.progress);
  const keysRef = useRef<Set<string>>(new Set());
  const lastTimeRef = useRef<number>(0);
  const stuckSinceRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  // Surface-break grace: switching TURBINE→PROPULSOR while submerged with the
  // ascend key (ArrowDown) held lets the bottom propulsor thrust through the water
  // surface. Stays active until the rover surfaces, releases the key, or switches
  // back to turbines.
  const surfaceBreakRef = useRef<boolean>(false);

  const sync = useCallback((next: GameState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  // ---- Mission completion / abort -----------------------------------------

  const completeMission = useCallback(() => {
    const level = levelRef.current;
    if (!level) return;
    const elapsed = Math.round(stateRef.current.elapsedMs);
    const previous =
      progressRef.current.find((r) => r.levelId === level.id)?.bestTimeMs ?? null;
    const isNewBest = previous === null || elapsed < previous;
    const nextProgress = applyCompletion(progressRef.current, level.id, elapsed);
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    saveProgress(nextProgress);
    setResult({
      timeMs: elapsed,
      bestTimeMs: isNewBest ? elapsed : (previous as number),
      isNewBest,
    });
    sync(transition(stateRef.current, 'ESCAPE')); // allSamplesCollected → ESCAPED
  }, [sync]);

  const abortMission = useCallback(() => {
    sync(transition(stateRef.current, 'ESCAPE')); // !allSamplesCollected → MISSION_ABORTED
  }, [sync]);

  const failMission = useCallback(() => {
    sync(transition(stateRef.current, 'DESTROY'));
  }, [sync]);

  // ---- Physics step --------------------------------------------------------

  const step = useCallback(
    (dt: number) => {
      const level = levelRef.current;
      if (!level) return;
      // The working heightmap (carved by the laser) drives collision and landing;
      // it falls back to the level's terrain before the first mutation.
      const heightmap = stateRef.current.heightmap ?? level.heightmap;
      let rover = stateRef.current.rover;
      const keys = keysRef.current;
      const bottom = keys.has('ArrowDown');
      const left = keys.has('ArrowLeft');
      const right = keys.has('ArrowRight');
      const anyThrust = bottom || left || right;

      // Active mode picks which thruster (and resource) actually produces force:
      // turbines underwater (electricity), propulsors in atmosphere (fuel).
      const turbineMode = rover.mode === PropulsorMode.TURBINE;
      const fire = (r: RoverState, dir: ThrusterDir): RoverState =>
        turbineMode ? applyTurbine(r, dir, dt) : applyPropulsor(r, dir, dt);

      // The surface-break grace ends once the rover is no longer holding up in
      // propulsor mode underwater.
      if (surfaceBreakRef.current && (turbineMode || !bottom || !rover.underwater)) {
        surfaceBreakRef.current = false;
      }

      // Leave the ground when thrusting with the active-mode resource available.
      const canThrust = turbineMode ? rover.electricity > 0 : rover.fuel > 0;
      if (rover.grounded && anyThrust && canThrust) {
        rover = { ...rover, grounded: false };
      }

      rover = applyGravity(rover, dt, level.gravity);
      if (bottom) {
        if (!turbineMode && surfaceBreakRef.current && rover.underwater) {
          // Documented exception: a propulsor pulse fired through the surface.
          // Treat the rover as surfaced for this one step (reusing the tested
          // pure function); underwater is recomputed from position below.
          const surfaced = applyPropulsor(
            { ...rover, underwater: false },
            ThrusterDirection.BOTTOM,
            dt,
          );
          rover = { ...surfaced, underwater: rover.underwater };
        } else {
          rover = fire(rover, ThrusterDirection.BOTTOM);
        }
      }
      if (left) rover = fire(rover, ThrusterDirection.LEFT);
      if (right) rover = fire(rover, ThrusterDirection.RIGHT);

      if (!rover.grounded) rover = integratePosition(rover, dt);

      // Keep the rover within the horizontal scene bounds.
      const maxX = Math.max(0, heightmap.length - ROVER_WIDTH);
      rover = {
        ...rover,
        position: { ...rover.position, x: clamp(rover.position.x, 0, maxX) },
        underwater: isUnderwater(rover, level.waterZones),
      };

      let samples = stateRef.current.samples;
      let elapsedMs = stateRef.current.elapsedMs + dt * 1000;
      let nextState: GameState = { ...stateRef.current, rover, samples, elapsedMs };

      // Escape (top edge) — complete with all samples, otherwise abort.
      if (hasEscaped(rover)) {
        stateRef.current = nextState;
        if (allSamplesCollected(samples)) completeMission();
        else abortMission();
        return;
      }

      // Terrain contact — safe landing or destruction.
      if (!rover.grounded && detectTerrainCollision(rover, heightmap)) {
        const centerColumn = Math.floor(rover.position.x + ROVER_WIDTH / 2);
        const safe = isLandingSafe(rover.velocity.y, rover.velocity.x);
        const validZone = isValidLandingZone(heightmap, centerColumn, ROVER_WIDTH);
        if (safe && validZone) {
          const surface = getHeight(heightmap, centerColumn);
          rover = {
            ...rover,
            position: { ...rover.position, y: SCENE_HEIGHT - surface - ROVER_HEIGHT },
            velocity: { x: 0, y: 0 },
            grounded: true,
          };
          samples = tryCollectSample(samples, landingSampleColumn(nextState, centerColumn));
          nextState = {
            ...nextState,
            rover,
            samples,
            allSamplesCollected: allSamplesCollected(samples),
          };
          stateRef.current = nextState;
        } else {
          stateRef.current = nextState;
          failMission();
          return;
        }
      }

      // Stranded with no way to move: grounded on land with no fuel (propulsors
      // cannot fire, so no take-off and no escape); submerged on a turbine-less
      // level with no fuel; or submerged on a turbine level with no electricity
      // (turbines cannot fire and propulsors give no thrust underwater). Fail
      // after the timeout so the player is never trapped.
      const strandedOnLand = rover.grounded && !rover.underwater && rover.fuel <= 0;
      const strandedUnderwater =
        rover.underwater && !level.tools.waterTurbines && rover.fuel <= 0;
      const strandedUnderwaterTurbines =
        rover.underwater && level.tools.waterTurbines && rover.electricity <= 0;
      const stuck = strandedOnLand || strandedUnderwater || strandedUnderwaterTurbines;
      const now = performance.now();
      if (stuck) {
        if (stuckSinceRef.current === null) stuckSinceRef.current = now;
        else if (now - stuckSinceRef.current >= STUCK_TIMEOUT_MS) {
          stateRef.current = nextState;
          failMission();
          return;
        }
      } else {
        stuckSinceRef.current = null;
      }

      sync(nextState);
    },
    [sync, completeMission, abortMission, failMission],
  );

  // ---- RAF loop, active only while PLAYING ---------------------------------

  useEffect(() => {
    if (state.status !== GameStatus.PLAYING) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    lastTimeRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, MAX_DT);
      lastTimeRef.current = now;
      if (dt > 0) step(dt);
      if (stateRef.current.status === GameStatus.PLAYING) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [state.status, step]);

  // ---- Keyboard input ------------------------------------------------------

  useEffect(() => {
    const MOVEMENT = new Set(['ArrowDown', 'ArrowLeft', 'ArrowRight']);
    const onKeyDown = (e: KeyboardEvent) => {
      if (MOVEMENT.has(e.key)) {
        keysRef.current.add(e.key);
        e.preventDefault();
        return;
      }
      if (e.key === 'Escape') {
        const status = stateRef.current.status;
        if (status === GameStatus.PLAYING) sync(transition(stateRef.current, 'PAUSE'));
        else if (status === GameStatus.PAUSED) sync(transition(stateRef.current, 'CONTINUE'));
        return;
      }
      // Toggle propulsor / turbine mode — only on turbine-capable levels.
      if (e.key === 'm' || e.key === 'M') {
        const level = levelRef.current;
        if (!level?.tools.waterTurbines || stateRef.current.status !== GameStatus.PLAYING) {
          return;
        }
        const rover = stateRef.current.rover;
        const nextMode =
          rover.mode === PropulsorMode.TURBINE
            ? PropulsorMode.PROPULSOR
            : PropulsorMode.TURBINE;
        if (
          nextMode === PropulsorMode.PROPULSOR &&
          rover.underwater &&
          keysRef.current.has('ArrowDown')
        ) {
          surfaceBreakRef.current = true;
        }
        const next: GameState = { ...stateRef.current, rover: { ...rover, mode: nextMode } };
        stateRef.current = next;
        sync(next);
        return;
      }
      // Fire the laser — only while grounded on a laser level with enough fuel.
      // It carves a pit, exposes any subsurface sample under it, spends fuel, and
      // ungrounds the rover so it drops into the pit.
      if (e.key === 'x' || e.key === 'X') {
        const level = levelRef.current;
        if (!level?.tools.laser || stateRef.current.status !== GameStatus.PLAYING) return;
        const cur = stateRef.current;
        const rover = cur.rover;
        if (!rover.grounded || rover.fuel < LASER_FUEL_COST) return;
        const centerColumn = Math.floor(rover.position.x + ROVER_WIDTH / 2);
        const next: GameState = {
          ...cur,
          rover: { ...rover, fuel: rover.fuel - LASER_FUEL_COST, grounded: false },
          samples: exposeSubsurfaceSamples(cur.samples, centerColumn),
          heightmap: fireLaser(cur.heightmap ?? level.heightmap, centerColumn),
        };
        stateRef.current = next;
        sync(next);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [sync]);

  // ---- Imperative controls exposed to the UI -------------------------------

  const selectLevel = useCallback(
    (level: LevelConfig) => {
      levelRef.current = level;
      keysRef.current.clear();
      stuckSinceRef.current = null;
      surfaceBreakRef.current = false;
      setResult(null);
      sync(createMissionState(level));
    },
    [sync],
  );

  const pause = useCallback(() => sync(transition(stateRef.current, 'PAUSE')), [sync]);
  const resume = useCallback(() => sync(transition(stateRef.current, 'CONTINUE')), [sync]);

  const restart = useCallback(() => {
    const level = levelRef.current;
    if (!level) return;
    keysRef.current.clear();
    stuckSinceRef.current = null;
    surfaceBreakRef.current = false;
    setResult(null);
    sync(transition(stateRef.current, 'RESTART', level));
  }, [sync]);

  const exit = useCallback(() => {
    keysRef.current.clear();
    setResult(null);
    sync(transition(stateRef.current, 'EXIT'));
  }, [sync]);

  const dismissWarning = useCallback(() => setWarning(null), []);

  return {
    state,
    level: levelRef.current,
    progress,
    result,
    warning,
    selectLevel,
    pause,
    resume,
    restart,
    exit,
    dismissWarning,
  };
}
