import { useCallback, useEffect, useRef, useState } from 'react';
import i18n from '../../i18n/config';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_THEME,
  DRAW,
  GameMode,
  GameStatus,
  Language,
  MACHINE_MOVE_DELAY_MS,
  STORAGE_KEYS,
  Theme,
} from '../constants';
import type {
  GameMode as GameModeType,
  Language as LanguageType,
  PlayerSymbol,
  Theme as ThemeType,
} from '../constants';
import { MEME_BASE_PATH, MEME_CATALOG } from '../constants/memes';
import { createInitialBoard } from '../engine/board';
import { getBestMove } from '../engine/minimax';
import { applyMove, confirmSetup, startNewGame } from './transitions';
import type { GameState } from './transitions';
import { buildMatchRecord } from '../history/history';
import type { MatchRecord } from '../history/history';
import { getMemeCategory, pickRandomMeme } from '../memes/memes';
import { validateHistory, validatePrefs } from '../validation/localStorage';
import type { GatoPrefs } from '../validation/localStorage';

export interface SetupSubmission {
  mode: GameModeType;
  humanSymbol: PlayerSymbol;
  playerOne: string;
  playerTwo: string;
}

export interface ActiveMeme {
  src: string;
}

const isBrowser = typeof window !== 'undefined';

function detectLanguage(): LanguageType {
  if (isBrowser && navigator.language?.toLowerCase().startsWith(Language.ES)) {
    return Language.ES;
  }
  return DEFAULT_LANGUAGE;
}

function detectTheme(): ThemeType {
  if (isBrowser && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return Theme.DARK;
  }
  return DEFAULT_THEME;
}

function defaultPrefs(): GatoPrefs {
  return { language: detectLanguage(), theme: detectTheme() };
}

function machineName(): string {
  return i18n.t('history.machine');
}

function hasCompleteSetup(prefs: GatoPrefs): boolean {
  if (!prefs.mode || !prefs.humanSymbol || !prefs.playerOne) return false;
  if (prefs.mode === GameMode.HVH && !prefs.playerTwo) return false;
  return true;
}

/** Whether the current game has registered players (so setup can be skipped). */
function isRegistered(game: GameState): boolean {
  if (!game.playerOne) return false;
  if (game.mode === GameMode.HVH && !game.playerTwo) return false;
  return true;
}

function setupState(prefs: GatoPrefs): GameState {
  const humanSymbol = prefs.humanSymbol ?? 'X';
  return {
    status: GameStatus.SETUP,
    mode: prefs.mode ?? GameMode.HVM,
    board: createInitialBoard(),
    currentTurn: humanSymbol,
    humanSymbol,
    playerOne: prefs.playerOne ?? '',
    playerTwo: prefs.playerTwo ?? '',
    winner: null,
    winningLine: null,
    turnCount: 0,
  };
}

function initialGame(prefs: GatoPrefs): GameState {
  if (hasCompleteSetup(prefs)) {
    return confirmSetup({
      mode: prefs.mode!,
      humanSymbol: prefs.humanSymbol!,
      playerOne: prefs.playerOne!,
      playerTwo: prefs.mode === GameMode.HVM ? machineName() : prefs.playerTwo!,
    });
  }
  return setupState(prefs);
}

function loadPrefs(): { prefs: GatoPrefs; warning: boolean } {
  if (!isBrowser) return { prefs: defaultPrefs(), warning: false };
  const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
  if (raw === null) return { prefs: defaultPrefs(), warning: false };
  const result = validatePrefs(raw);
  if (!result.ok) return { prefs: defaultPrefs(), warning: true };
  return { prefs: { ...defaultPrefs(), ...result.value }, warning: false };
}

function loadHistory(): { history: MatchRecord[]; warning: boolean } {
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

export interface GatoController {
  game: GameState;
  prefs: GatoPrefs;
  history: MatchRecord[];
  meme: ActiveMeme | null;
  memeError: boolean;
  storageWarning: boolean;
  editOpen: boolean;
  historyOpen: boolean;
  isMachineThinking: boolean;
  playCell: (cell: number) => void;
  submitSetup: (submission: SetupSubmission) => void;
  startNew: () => void;
  closeMeme: () => void;
  openEdit: () => void;
  closeEdit: () => void;
  openHistory: () => void;
  closeHistory: () => void;
  clearHistory: () => void;
  setLanguage: (language: LanguageType) => void;
  toggleTheme: () => void;
  dismissStorageWarning: () => void;
}

export function useGato(): GatoController {
  const initialPrefs = useRef(loadPrefs());
  const initialHistory = useRef(loadHistory());

  const [prefs, setPrefs] = useState<GatoPrefs>(initialPrefs.current.prefs);
  const [game, setGame] = useState<GameState>(() =>
    initialGame(initialPrefs.current.prefs),
  );
  const [history, setHistory] = useState<MatchRecord[]>(
    initialHistory.current.history,
  );
  const [meme, setMeme] = useState<ActiveMeme | null>(null);
  const [memeError, setMemeError] = useState(false);
  const [storageWarning, setStorageWarning] = useState(
    initialPrefs.current.warning || initialHistory.current.warning,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const recordedRef = useRef(false);

  // Apply theme and language to the document and the i18n instance.
  useEffect(() => {
    if (isBrowser) {
      document.documentElement.dataset.theme = prefs.theme;
    }
    if (i18n.language !== prefs.language) {
      void i18n.changeLanguage(prefs.language);
    }
  }, [prefs.theme, prefs.language]);

  // Machine auto-move in HVM when it is the machine's turn.
  useEffect(() => {
    if (
      game.mode !== GameMode.HVM ||
      game.status !== GameStatus.PLAYING ||
      game.currentTurn === game.humanSymbol
    ) {
      return;
    }
    const timer = setTimeout(() => {
      setGame((current) => {
        if (
          current.status !== GameStatus.PLAYING ||
          current.currentTurn === current.humanSymbol
        ) {
          return current;
        }
        return applyMove(current, getBestMove(current.board, current.currentTurn));
      });
    }, MACHINE_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [game]);

  // Record the match and resolve a meme exactly once when a game ends.
  useEffect(() => {
    if (game.status === GameStatus.GAME_OVER && !recordedRef.current) {
      recordedRef.current = true;

      const record = buildMatchRecord(game);
      setHistory((previous) => {
        const next = [...previous, record];
        persist(STORAGE_KEYS.HISTORY, next);
        return next;
      });

      const category = getMemeCategory({
        winner: game.winner ?? DRAW,
        humanSymbol: game.humanSymbol,
        mode: game.mode,
      });
      const filename = pickRandomMeme(MEME_CATALOG, category);
      if (filename) {
        setMeme({ src: `${MEME_BASE_PATH}/${category}/${filename}` });
        setMemeError(false);
      } else {
        setMeme(null);
        setMemeError(true);
      }
    }
    if (game.status !== GameStatus.GAME_OVER) {
      recordedRef.current = false;
    }
  }, [game]);

  const isHumanTurn =
    game.mode === GameMode.HVH || game.currentTurn === game.humanSymbol;
  const isMachineThinking =
    game.mode === GameMode.HVM &&
    game.status === GameStatus.PLAYING &&
    game.currentTurn !== game.humanSymbol;

  const playCell = useCallback(
    (cell: number) => {
      if (
        game.status !== GameStatus.IDLE &&
        game.status !== GameStatus.PLAYING
      ) {
        return;
      }
      if (!isHumanTurn) return;
      setGame((current) => applyMove(current, cell));
    },
    [game.status, isHumanTurn],
  );

  const applySetup = useCallback((submission: SetupSubmission) => {
    const playerTwo =
      submission.mode === GameMode.HVM ? machineName() : submission.playerTwo;
    const nextPrefs: GatoPrefs = {
      language: i18n.language === Language.ES ? Language.ES : Language.EN,
      theme: (document.documentElement.dataset.theme as ThemeType) ?? DEFAULT_THEME,
      mode: submission.mode,
      humanSymbol: submission.humanSymbol,
      playerOne: submission.playerOne,
      playerTwo,
    };
    setPrefs((current) => {
      const merged: GatoPrefs = { ...current, ...nextPrefs };
      persist(STORAGE_KEYS.PREFS, merged);
      return merged;
    });
    setMeme(null);
    setMemeError(false);
    setGame(
      confirmSetup({
        mode: submission.mode,
        humanSymbol: submission.humanSymbol,
        playerOne: submission.playerOne,
        playerTwo,
      }),
    );
  }, []);

  const submitSetup = useCallback(
    (submission: SetupSubmission) => {
      applySetup(submission);
      setEditOpen(false);
    },
    [applySetup],
  );

  const startNew = useCallback(() => {
    setMeme(null);
    setMemeError(false);
    setGame((current) =>
      isRegistered(current)
        ? confirmSetup({
            mode: current.mode,
            humanSymbol: current.humanSymbol,
            playerOne: current.playerOne,
            playerTwo: current.playerTwo,
          })
        : startNewGame(current),
    );
  }, []);

  const closeMeme = useCallback(() => {
    setMeme(null);
    setMemeError(false);
  }, []);

  const openEdit = useCallback(() => setEditOpen(true), []);
  const closeEdit = useCallback(() => setEditOpen(false), []);
  const openHistory = useCallback(() => setHistoryOpen(true), []);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    persist(STORAGE_KEYS.HISTORY, []);
  }, []);

  const setLanguage = useCallback((language: LanguageType) => {
    setPrefs((current) => {
      const merged: GatoPrefs = { ...current, language };
      persist(STORAGE_KEYS.PREFS, merged);
      return merged;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setPrefs((current) => {
      const theme = current.theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
      const merged: GatoPrefs = { ...current, theme };
      persist(STORAGE_KEYS.PREFS, merged);
      return merged;
    });
  }, []);

  const dismissStorageWarning = useCallback(() => setStorageWarning(false), []);

  return {
    game,
    prefs,
    history,
    meme,
    memeError,
    storageWarning,
    editOpen,
    historyOpen,
    isMachineThinking,
    playCell,
    submitSetup,
    startNew,
    closeMeme,
    openEdit,
    closeEdit,
    openHistory,
    closeHistory,
    clearHistory,
    setLanguage,
    toggleTheme,
    dismissStorageWarning,
  };
}
