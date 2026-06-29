// Mission controller: the only bridge between the pure engine and React. Owns the
// requestAnimationFrame loop, keyboard input, the stuck-timeout, localStorage
// progress persistence and best-time bookkeeping. All rules live in the pure
// modules; this file only wires them to time, input and storage.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GameStatus,
  ThrusterDirection,
  STORAGE_KEYS,
  STUCK_TIMEOUT_MS,
  ROVER_WIDTH,
  ROVER_HEIGHT,
  SCENE_HEIGHT,
} from '../constants';
import type { GameState } from '../constants';
import type { LevelConfig } from '../levels';
import { LEVELS } from '../levels';
import { applyGravity, applyPropulsor, integratePosition } from '../physics/physics';
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

/** Column nearest the rover center that holds an uncollected sample, if within reach. */
function landingSampleColumn(
  state: GameState,
  centerColumn: number,
): number {
  const reach = ROVER_WIDTH / 2;
  const hit = state.samples.find(
    (sample) => !sample.collected && Math.abs(sample.columnIndex - centerColumn) <= reach,
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
    sync(transition(stateRef.current, 'ESCAPE')); // !allSamplesCollected → LEVEL_SELECT
  }, [sync]);

  const failMission = useCallback(() => {
    sync(transition(stateRef.current, 'DESTROY'));
  }, [sync]);

  // ---- Physics step --------------------------------------------------------

  const step = useCallback(
    (dt: number) => {
      const level = levelRef.current;
      if (!level) return;
      let rover = stateRef.current.rover;
      const keys = keysRef.current;
      const bottom = keys.has('ArrowUp');
      const left = keys.has('ArrowLeft');
      const right = keys.has('ArrowRight');
      const anyThrust = bottom || left || right;

      // Leave the ground when thrusting with fuel available.
      if (rover.grounded && anyThrust && rover.fuel > 0) {
        rover = { ...rover, grounded: false };
      }

      rover = applyGravity(rover, dt, level.gravity);
      if (bottom) rover = applyPropulsor(rover, ThrusterDirection.BOTTOM, dt);
      if (left) rover = applyPropulsor(rover, ThrusterDirection.LEFT, dt);
      if (right) rover = applyPropulsor(rover, ThrusterDirection.RIGHT, dt);

      if (!rover.grounded) rover = integratePosition(rover, dt);

      // Keep the rover within the horizontal scene bounds.
      const maxX = Math.max(0, level.heightmap.length - ROVER_WIDTH);
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
      if (!rover.grounded && detectTerrainCollision(rover, level.heightmap)) {
        const centerColumn = Math.floor(rover.position.x + ROVER_WIDTH / 2);
        const safe = isLandingSafe(rover.velocity.y, rover.velocity.x);
        const validZone = isValidLandingZone(level.heightmap, centerColumn, ROVER_WIDTH);
        if (safe && validZone) {
          const surface = getHeight(level.heightmap, centerColumn);
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

      // Stuck underwater on a turbine-less level with no fuel.
      const stuck = rover.underwater && !level.tools.waterTurbines && rover.fuel <= 0;
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
    const MOVEMENT = new Set(['ArrowUp', 'ArrowLeft', 'ArrowRight']);
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
