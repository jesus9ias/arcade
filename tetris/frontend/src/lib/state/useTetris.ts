// The single controller bridging pure logic and React. Owns the rAF loop,
// keyboard/touch input (with DAS/ARR), the lock timer, scoring/progression,
// audio, and all localStorage side effects. Components render its snapshot and
// call its actions; they contain no game logic.

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import i18n from '../../i18n/config';
import {
  clearLines,
  dropDistance,
  getGhostPiece,
  isColliding,
  isPerfectClear,
  lockPiece,
} from '../engine/board';
import { createPiece, getAbsoluteCells } from '../engine/piece';
import type { ActivePiece } from '../engine/piece';
import { advance, createLockState, hasExpired, reset as resetLock } from '../engine/lock';
import { draw } from '../randomizer/bag';
import { tryRotate } from '../rotation/srs';
import { detectSpin } from '../scoring/tspin';
import {
  hardDropPoints,
  isDifficultClear,
  scorePlacement,
  softDropPoints,
} from '../scoring/scoring';
import { applyProgress, gravityForLevel, levelGoal, lineCredit, backToBackCredit } from '../scoring/progression';
import { addRecord, buildRecord, clearHistory } from '../history/records';
import type { GameOutcome, Scores } from '../history/records';
import { applyHold } from './hold';
import { createInitialState, transition } from './transitions';
import type { GameState } from './transitions';
import { validatePrefs, validateScores } from '../validation/localStorage';
import { DEFAULT_PREFS } from '../constants/preferences';
import type { Language, Prefs } from '../constants/preferences';
import { BUFFER_HEIGHT, NEXT_QUEUE_SIZE, SOFT_DROP_FACTOR } from '../constants/game';
import { MAX_LEVEL, MIN_LEVEL } from '../constants/levels';
import { STORAGE_KEYS } from '../constants/storage';
import { ARR_MS, DAS_MS } from '../constants/input';
import { AudioManager } from '../audio/sfx';

const clampLevel = (n: number) => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(n)));

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — ignore */
  }
}

export interface TetrisController {
  state: GameState;
  ghost: ActivePiece | null;
  prefs: Prefs;
  scores: Scores;
  storageWarning: boolean;
  start: () => void;
  togglePause: () => void;
  restart: () => void;
  goToMenu: () => void;
  setStartLevel: (n: number) => void;
  setLanguage: (lang: Language) => void;
  toggleMute: () => void;
  clearScores: () => void;
  dismissWarning: () => void;
  playModalOpen: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  rotateCw: () => void;
  rotateCcw: () => void;
  softDropStart: () => void;
  softDropEnd: () => void;
  hardDrop: () => void;
  hold: () => void;
}

export function useTetris(): TetrisController {
  const [, forceRender] = useReducer((c: number) => c + 1, 0);

  const stateRef = useRef<GameState>(createInitialState(DEFAULT_PREFS.startLevel));
  const prefsRef = useRef<Prefs>(DEFAULT_PREFS);
  const scoresRef = useRef<Scores>({ records: [], best: null });
  const audioRef = useRef<AudioManager>(new AudioManager(DEFAULT_PREFS.muted));
  const rng = useRef<() => number>(Math.random);

  const [warning, setWarning] = useState(false);

  // Input state.
  const heldDir = useRef<0 | 1 | -1>(0);
  const dasTimer = useRef(0);
  const arrTimer = useRef(0);
  const softDrop = useRef(false);
  const gravityAcc = useRef(0);
  const lastRotation = useRef(false);
  const lastKickIndex = useRef(0);

  const commit = useCallback(() => {
    stateRef.current = { ...stateRef.current };
    forceRender();
  }, []);

  // ---- pure helpers over the current board ----------------------------------
  const canMoveDown = (piece: ActivePiece) =>
    !isColliding(stateRef.current.board, { ...piece, y: piece.y + 1 });

  const gravityIntervalMs = () => {
    const base = gravityForLevel(stateRef.current.level) * 1000;
    return softDrop.current ? base / SOFT_DROP_FACTOR : base;
  };

  const persistScores = useCallback(() => {
    writeStorage(STORAGE_KEYS.scores, JSON.stringify(scoresRef.current));
  }, []);

  const persistPrefs = useCallback(() => {
    writeStorage(STORAGE_KEYS.prefs, JSON.stringify(prefsRef.current));
  }, []);

  const refillQueue = (s: GameState) => {
    while (s.queue.length < NEXT_QUEUE_SIZE) {
      const res = draw(s.bag, rng.current);
      s.queue = [...s.queue, res.piece];
      s.bag = res.bag;
    }
  };

  const recordRun = useCallback(
    (outcome: GameOutcome) => {
      const s = stateRef.current;
      const record = buildRecord({
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        date: new Date().toISOString(),
        startLevel: s.startLevel,
        endLevel: s.level,
        linesCleared: s.linesCleared,
        regularPoints: s.breakdown.regular,
        bonusPoints: s.breakdown.bonus,
        durationMs: Math.round(s.elapsedMs),
        outcome,
      });
      scoresRef.current = addRecord(scoresRef.current, record);
      persistScores();
    },
    [persistScores],
  );

  // Spawn the next piece; returns false and ends the run on a block-out.
  const spawnNext = (s: GameState): boolean => {
    const type = s.queue[0];
    s.queue = s.queue.slice(1);
    refillQueue(s);
    s.active = createPiece(type);
    s.lock = createLockState();
    s.holdUsedThisPiece = false;
    lastRotation.current = false;
    gravityAcc.current = 0;
    if (isColliding(s.board, s.active)) {
      s.active = null;
      stateRef.current = transition(s, 'GAME_OVER');
      recordRun('GAME_OVER');
      audioRef.current.play('gameOver');
      audioRef.current.stopMusic();
      return false;
    }
    return true;
  };

  const lockAndResolve = () => {
    const s = stateRef.current;
    if (!s.active) return;
    const piece = s.active;

    const spin = detectSpin(s.board, piece, lastRotation.current, lastKickIndex.current === 4);

    // Lock-out: the piece settled entirely within the hidden buffer.
    const lockedInBuffer = getAbsoluteCells(piece).every((c) => c.y < BUFFER_HEIGHT);

    const locked = lockPiece(s.board, piece);
    const { board, cleared } = clearLines(locked);
    s.board = board;
    s.active = null;

    const comboMultiplier = s.combo; // 0 for the first clear in a chain
    const difficult = isDifficultClear(cleared, spin);
    const b2bActive = s.backToBack && difficult;
    const perfectClear = cleared > 0 && isPerfectClear(board);

    const placement = scorePlacement({
      lines: cleared,
      spin,
      level: s.level,
      backToBack: b2bActive,
      combo: comboMultiplier,
      perfectClear,
      softDropCells: 0,
      hardDropCells: 0,
    });
    s.score += placement.total;
    s.breakdown = {
      regular: s.breakdown.regular + placement.regular,
      bonus: s.breakdown.bonus + placement.bonus,
    };

    // Combo + back-to-back bookkeeping.
    if (cleared > 0) {
      s.combo = s.combo + 1;
      s.backToBack = difficult;
    } else {
      s.combo = 0;
    }

    // Credited lines toward the level goal.
    let credit = lineCredit(cleared, spin);
    if (b2bActive) credit += backToBackCredit(credit);
    s.linesCleared += cleared;

    const prog = applyProgress(
      { level: s.level, credited: s.creditedLines, startLevel: s.startLevel },
      credit,
    );
    const leveledUp = prog.level > s.level;
    s.level = prog.level;
    s.creditedLines = prog.credited;
    s.levelGoal = levelGoal(s.level, s.startLevel);

    // Sound feedback.
    audioRef.current.play('lock');
    if (spin !== 'none' && cleared > 0) audioRef.current.play('tspin');
    else if (cleared === 4) audioRef.current.play('tetris');
    else if (cleared > 0) audioRef.current.play('lineClear');
    if (b2bActive || perfectClear) audioRef.current.play('bonus');
    if (leveledUp) audioRef.current.play('levelUp');

    if (prog.completed) {
      stateRef.current = transition(s, 'VICTORY');
      recordRun('VICTORY');
      audioRef.current.stopMusic();
      return;
    }
    if (lockedInBuffer) {
      stateRef.current = transition(s, 'GAME_OVER');
      recordRun('GAME_OVER');
      audioRef.current.play('gameOver');
      audioRef.current.stopMusic();
      return;
    }
    spawnNext(s);
  };

  // ---- movement actions -----------------------------------------------------
  const resetLockIfResting = () => {
    const s = stateRef.current;
    if (s.active && !canMoveDown(s.active)) s.lock = resetLock(s.lock);
  };

  const tryShift = (dx: number) => {
    const s = stateRef.current;
    if (s.status !== 'PLAYING' || !s.active) return;
    const moved = { ...s.active, x: s.active.x + dx };
    if (!isColliding(s.board, moved)) {
      s.active = moved;
      lastRotation.current = false;
      resetLockIfResting();
      audioRef.current.play('move');
      commit();
    }
  };

  const doRotate = (dir: 1 | -1) => {
    const s = stateRef.current;
    if (s.status !== 'PLAYING' || !s.active) return;
    const result = tryRotate(s.board, s.active, dir);
    if (result) {
      s.active = result.piece;
      lastRotation.current = true;
      lastKickIndex.current = result.kickIndex;
      resetLockIfResting();
      audioRef.current.play('rotate');
      commit();
    }
  };

  const doHardDrop = () => {
    const s = stateRef.current;
    if (s.status !== 'PLAYING' || !s.active) return;
    const d = dropDistance(s.board, s.active);
    if (d > 0) {
      s.active = { ...s.active, y: s.active.y + d };
      s.score += hardDropPoints(d);
      s.breakdown = { ...s.breakdown, regular: s.breakdown.regular + hardDropPoints(d) };
      lastRotation.current = false;
    }
    audioRef.current.play('hardDrop');
    lockAndResolve();
    commit();
  };

  const doHold = () => {
    const s = stateRef.current;
    if (s.status !== 'PLAYING' || !s.active) return;
    const before = s.queue.length;
    const ctx = applyHold({
      active: s.active,
      hold: s.hold,
      queue: s.queue,
      holdsRemaining: s.holdsRemaining,
      holdUsedThisPiece: s.holdUsedThisPiece,
    });
    if (ctx.active === s.active && ctx.hold === s.hold) return; // no-op
    s.active = ctx.active;
    s.hold = ctx.hold;
    s.queue = ctx.queue;
    s.holdsRemaining = ctx.holdsRemaining;
    s.holdUsedThisPiece = ctx.holdUsedThisPiece;
    if (s.queue.length < before) refillQueue(s);
    s.lock = createLockState();
    lastRotation.current = false;
    gravityAcc.current = 0;
    audioRef.current.play('hold');
    if (isColliding(s.board, s.active)) {
      s.active = null;
      stateRef.current = transition(s, 'GAME_OVER');
      recordRun('GAME_OVER');
      audioRef.current.stopMusic();
    }
    commit();
  };

  // ---- the frame loop -------------------------------------------------------
  const step = (dt: number) => {
    const s = stateRef.current;
    if (s.status !== 'PLAYING' || s.active === null) return;
    s.elapsedMs += dt;
    let piece: ActivePiece = s.active;

    // Auto-shift (DAS/ARR).
    if (heldDir.current !== 0) {
      dasTimer.current += dt;
      if (dasTimer.current >= DAS_MS) {
        arrTimer.current += dt;
        while (arrTimer.current >= ARR_MS) {
          arrTimer.current -= ARR_MS;
          const moved: ActivePiece = { ...piece, x: piece.x + heldDir.current };
          if (!isColliding(s.board, moved)) {
            piece = moved;
            s.active = piece;
            lastRotation.current = false;
            resetLockIfResting();
          } else break;
        }
      }
    }

    // Gravity.
    if (canMoveDown(piece)) {
      gravityAcc.current += dt;
      const interval = gravityIntervalMs();
      while (gravityAcc.current >= interval && canMoveDown(piece)) {
        gravityAcc.current -= interval;
        piece = { ...piece, y: piece.y + 1 };
        s.active = piece;
        lastRotation.current = false;
        if (softDrop.current) {
          s.score += softDropPoints(1);
          s.breakdown = { ...s.breakdown, regular: s.breakdown.regular + softDropPoints(1) };
          audioRef.current.play('softDrop');
        }
      }
    } else {
      gravityAcc.current = 0;
    }

    // Lock delay.
    if (!canMoveDown(piece)) {
      s.lock = advance(s.lock, dt);
      if (hasExpired(s.lock)) {
        lockAndResolve();
      }
    } else {
      s.lock = { ...s.lock, elapsedMs: 0 };
    }

    commit();
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(now - last, 100); // clamp long frames (tab switches)
      last = now;
      step(dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- lifecycle: load prefs + scores ---------------------------------------
  useEffect(() => {
    const prefsResult = validatePrefs(readStorage(STORAGE_KEYS.prefs));
    if (prefsResult.ok) {
      prefsRef.current = prefsResult.value;
    } else if (readStorage(STORAGE_KEYS.prefs) !== null) {
      setWarning(true);
    }
    const scoresResult = validateScores(readStorage(STORAGE_KEYS.scores));
    if (scoresResult.ok) {
      scoresRef.current = scoresResult.value;
    } else if (readStorage(STORAGE_KEYS.scores) !== null) {
      setWarning(true);
    }
    audioRef.current.setMuted(prefsRef.current.muted);
    void i18n.changeLanguage(prefsRef.current.language);
    stateRef.current = createInitialState(prefsRef.current.startLevel, rng.current);
    commit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- keyboard -------------------------------------------------------------
  useEffect(() => {
    const isGameKey = (k: string) =>
      [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        ' ',
        'z',
        'Z',
        'x',
        'X',
        'c',
        'C',
      ].includes(k);

    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (isGameKey(e.key)) e.preventDefault();
      if (e.repeat) return;
      switch (e.key) {
        case 'ArrowLeft':
          heldDir.current = -1;
          dasTimer.current = 0;
          arrTimer.current = 0;
          tryShift(-1);
          break;
        case 'ArrowRight':
          heldDir.current = 1;
          dasTimer.current = 0;
          arrTimer.current = 0;
          tryShift(1);
          break;
        case 'ArrowDown':
          softDrop.current = true;
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          doRotate(1);
          break;
        case 'z':
        case 'Z':
          doRotate(-1);
          break;
        case ' ':
          doHardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          doHold();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          togglePause();
          break;
        case 'Enter':
          if (s.status === 'GAME_OVER' || s.status === 'VICTORY') restart();
          break;
        default:
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && heldDir.current === -1) heldDir.current = 0;
      if (e.key === 'ArrowRight' && heldDir.current === 1) heldDir.current = 0;
      if (e.key === 'ArrowDown') softDrop.current = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- top-level actions ----------------------------------------------------
  const start = useCallback(() => {
    const fresh = createInitialState(prefsRef.current.startLevel, rng.current);
    fresh.status = 'PLAYING';
    stateRef.current = fresh;
    heldDir.current = 0;
    softDrop.current = false;
    gravityAcc.current = 0;
    spawnNext(stateRef.current);
    audioRef.current.stopAllSfx();
    audioRef.current.startMusic();
    commit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit]);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (s.status === 'PLAYING') {
      stateRef.current = transition(s, 'PAUSE');
      audioRef.current.play('pause');
    } else if (s.status === 'PAUSED') {
      stateRef.current = transition(s, 'RESUME');
    }
    commit();
  }, [commit]);

  const restart = useCallback(() => {
    start();
  }, [start]);

  const goToMenu = useCallback(() => {
    stateRef.current = createInitialState(prefsRef.current.startLevel, rng.current);
    audioRef.current.stopMusic();
    audioRef.current.stopAllSfx();
    commit();
  }, [commit]);

  const setStartLevel = useCallback(
    (n: number) => {
      prefsRef.current = { ...prefsRef.current, startLevel: clampLevel(n) };
      persistPrefs();
      if (stateRef.current.status === 'IDLE') {
        stateRef.current = createInitialState(prefsRef.current.startLevel, rng.current);
      }
      commit();
    },
    [commit, persistPrefs],
  );

  const setLanguage = useCallback(
    (lang: Language) => {
      prefsRef.current = { ...prefsRef.current, language: lang };
      persistPrefs();
      void i18n.changeLanguage(lang);
      commit();
    },
    [commit, persistPrefs],
  );

  const toggleMute = useCallback(() => {
    const muted = !prefsRef.current.muted;
    prefsRef.current = { ...prefsRef.current, muted };
    persistPrefs();
    audioRef.current.setMuted(muted);
    commit();
  }, [commit, persistPrefs]);

  const clearScores = useCallback(() => {
    scoresRef.current = clearHistory();
    persistScores();
    commit();
  }, [commit, persistScores]);

  const dismissWarning = useCallback(() => setWarning(false), []);

  const playModalOpen = useCallback(() => {
    audioRef.current.play('modalOpen');
  }, []);

  const softDropStart = useCallback(() => {
    softDrop.current = true;
  }, []);
  const softDropEnd = useCallback(() => {
    softDrop.current = false;
  }, []);

  const s = stateRef.current;
  const ghost = useMemo(
    () => (s.status === 'PLAYING' && s.active ? getGhostPiece(s.board, s.active) : null),
    [s.status, s.active, s.board],
  );

  return {
    state: s,
    ghost,
    prefs: prefsRef.current,
    scores: scoresRef.current,
    storageWarning: warning,
    start,
    togglePause,
    restart,
    goToMenu,
    setStartLevel,
    setLanguage,
    toggleMute,
    clearScores,
    dismissWarning,
    playModalOpen,
    moveLeft: () => tryShift(-1),
    moveRight: () => tryShift(1),
    rotateCw: () => doRotate(1),
    rotateCcw: () => doRotate(-1),
    softDropStart,
    softDropEnd,
    hardDrop: doHardDrop,
    hold: doHold,
  };
}
