// The React controller: the only bridge between the pure logic and the UI.
// It owns the real-time tick loop, keyboard/touch input, localStorage side
// effects, the machine's moves, and recording finished games. No game rules
// live here — those are in the pure engine/scoring/level/ai modules.

import { useCallback, useEffect, useRef, useState } from 'react';
import i18n from '../../i18n/config';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_THEME,
  DEFAULT_MODE,
  GameMode,
  GameStatus,
  Language,
  Theme,
  STORAGE_KEYS,
  SNAKE_ID,
  BOOST_FACTOR,
} from '../constants';
import type {
  GameMode as GameModeValue,
  Language as LanguageValue,
  Theme as ThemeValue,
  Rotation,
} from '../constants';
import {
  createInitialState,
  advanceTick,
  queueTurn,
} from '../engine/engine';
import type { GameState } from '../engine/engine';
import { transition } from './transitions';
import { getMachineTurn } from '../ai/ai';
import { speedForLevel } from '../level/level';
import { buildGameRecord } from '../history/history';
import type { GameRecord } from '../history/history';
import { validateHistory, validatePrefs } from '../validation/localStorage';
import type { Prefs } from '../validation/localStorage';

const isBrowser = typeof window !== 'undefined';

function detectLanguage(): LanguageValue {
  if (isBrowser && navigator.language?.toLowerCase().startsWith(Language.ES)) {
    return Language.ES;
  }
  return DEFAULT_LANGUAGE;
}

function detectTheme(): ThemeValue {
  if (isBrowser && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return Theme.DARK;
  }
  return DEFAULT_THEME;
}

function defaultPrefs(): Prefs {
  return { language: detectLanguage(), theme: detectTheme(), mode: DEFAULT_MODE };
}

function loadPrefs(): { prefs: Prefs; warning: boolean } {
  if (!isBrowser) return { prefs: defaultPrefs(), warning: false };
  const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
  if (raw === null) return { prefs: defaultPrefs(), warning: false };
  const result = validatePrefs(raw);
  if (!result.ok) return { prefs: defaultPrefs(), warning: true };
  return { prefs: { ...defaultPrefs(), ...result.value }, warning: false };
}

function loadHistory(): { history: GameRecord[]; warning: boolean } {
  if (!isBrowser) return { history: [], warning: false };
  const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
  if (raw === null) return { history: [], warning: false };
  const result = validateHistory(raw);
  if (!result.ok) return { history: [], warning: true };
  return { history: result.value, warning: false };
}

function persist(key: string, value: unknown): void {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export interface SnakeController {
  game: GameState;
  prefs: Prefs;
  history: GameRecord[];
  storageWarning: boolean;
  helpOpen: boolean;
  historyOpen: boolean;
  turn: (rotation: Rotation) => void;
  start: () => void;
  newGame: () => void;
  togglePause: () => void;
  toggleBoost: () => void;
  setMode: (mode: GameModeValue) => void;
  openHelp: () => void;
  closeHelp: () => void;
  openHistory: () => void;
  closeHistory: () => void;
  clearHistory: () => void;
  setLanguage: (language: LanguageValue) => void;
  toggleTheme: () => void;
  dismissStorageWarning: () => void;
}

export function useSnake(): SnakeController {
  const initialPrefs = useRef(loadPrefs());
  const initialHistory = useRef(loadHistory());

  const [prefs, setPrefs] = useState<Prefs>(initialPrefs.current.prefs);
  const [game, setGame] = useState<GameState>(() =>
    createInitialState(initialPrefs.current.prefs.mode),
  );
  const [history, setHistory] = useState<GameRecord[]>(
    initialHistory.current.history,
  );
  const [storageWarning, setStorageWarning] = useState(
    initialPrefs.current.warning || initialHistory.current.warning,
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const recordedRef = useRef(false);

  // Apply theme and language to the document and i18n.
  useEffect(() => {
    if (isBrowser) document.documentElement.dataset.theme = prefs.theme;
    if (i18n.language !== prefs.language) void i18n.changeLanguage(prefs.language);
  }, [prefs.theme, prefs.language]);

  // The real-time tick loop. Restarts only when the status or tick interval
  // changes (level-up or boost), not on every input.
  useEffect(() => {
    if (game.status !== GameStatus.PLAYING) return;
    const id = window.setInterval(() => {
      setGame((current) => {
        if (current.status !== GameStatus.PLAYING) return current;
        let next = current;
        if (current.mode === GameMode.VERSUS) {
          const rotation = getMachineTurn(current);
          if (rotation) next = queueTurn(next, SNAKE_ID.MACHINE, rotation);
        }
        return advanceTick(next);
      });
    }, game.speedMs);
    return () => window.clearInterval(id);
  }, [game.status, game.speedMs]);

  // Record a finished game exactly once.
  useEffect(() => {
    if (game.status === GameStatus.GAME_OVER && !recordedRef.current) {
      recordedRef.current = true;
      const record = buildGameRecord(game);
      setHistory((previous) => {
        const next = [record, ...previous];
        persist(STORAGE_KEYS.HISTORY, next);
        return next;
      });
    }
    if (game.status !== GameStatus.GAME_OVER) recordedRef.current = false;
  }, [game]);

  const turn = useCallback((rotation: Rotation) => {
    setGame((current) =>
      current.status === GameStatus.PLAYING
        ? queueTurn(current, SNAKE_ID.PLAYER, rotation)
        : current,
    );
  }, []);

  const start = useCallback(() => {
    setGame((current) =>
      current.status === GameStatus.IDLE ? transition(current, 'START') : current,
    );
  }, []);

  const newGame = useCallback(() => {
    // Compose the pure NEW_GAME reset with an immediate start for a quick replay.
    setGame((current) => ({
      ...createInitialState(current.mode),
      status: GameStatus.PLAYING,
    }));
  }, []);

  const togglePause = useCallback(() => {
    setGame((current) => {
      if (current.status === GameStatus.PLAYING) return transition(current, 'PAUSE');
      if (current.status === GameStatus.PAUSED) return transition(current, 'RESUME');
      return current;
    });
  }, []);

  const toggleBoost = useCallback(() => {
    setGame((current) => {
      if (current.status !== GameStatus.PLAYING) return current;
      const boosted = !current.boosted;
      const normal = speedForLevel(current.level);
      return {
        ...current,
        boosted,
        speedMs: boosted ? Math.round(normal / BOOST_FACTOR) : normal,
      };
    });
  }, []);

  const setMode = useCallback((mode: GameModeValue) => {
    setPrefs((current) => {
      const merged: Prefs = { ...current, mode };
      persist(STORAGE_KEYS.PREFS, merged);
      return merged;
    });
    setGame(createInitialState(mode));
  }, []);

  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const openHistory = useCallback(() => setHistoryOpen(true), []);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    persist(STORAGE_KEYS.HISTORY, []);
  }, []);

  const setLanguage = useCallback((language: LanguageValue) => {
    setPrefs((current) => {
      const merged: Prefs = { ...current, language };
      persist(STORAGE_KEYS.PREFS, merged);
      return merged;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setPrefs((current) => {
      const theme = current.theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
      const merged: Prefs = { ...current, theme };
      persist(STORAGE_KEYS.PREFS, merged);
      return merged;
    });
  }, []);

  const dismissStorageWarning = useCallback(() => setStorageWarning(false), []);

  // Keyboard controls.
  useEffect(() => {
    if (!isBrowser) return;
    const handler = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          turn('CW');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          turn('CCW');
          break;
        case 'p':
        case 'P':
          togglePause();
          break;
        case 'a':
        case 'A':
          toggleBoost();
          break;
        case 'Enter':
          setGame((current) => {
            if (current.status === GameStatus.IDLE) return transition(current, 'START');
            if (current.status === GameStatus.PAUSED || current.status === GameStatus.GAME_OVER) {
              return { ...createInitialState(current.mode), status: GameStatus.PLAYING };
            }
            return current;
          });
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [turn, togglePause, toggleBoost]);

  return {
    game,
    prefs,
    history,
    storageWarning,
    helpOpen,
    historyOpen,
    turn,
    start,
    newGame,
    togglePause,
    toggleBoost,
    setMode,
    openHelp,
    closeHelp,
    openHistory,
    closeHistory,
    clearHistory,
    setLanguage,
    toggleTheme,
    dismissStorageWarning,
  };
}
