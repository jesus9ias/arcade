// Game-history records and grouping. A finished game produces one record;
// records are grouped by mode for the two history tabs.

import { GameMode } from '../constants';
import type { GameMode as GameModeValue, SnakeId } from '../constants';
import type { GameState } from '../engine/engine';

export interface GameRecord {
  id: string;
  date: string; // ISO 8601
  mode: GameModeValue;
  level: number; // level reached
  playerScore: number;
  machineScore?: number; // Versus only
  survivor?: SnakeId | null; // Versus only
}

/** Build a history record from a finished game state. */
export function buildGameRecord(state: GameState): GameRecord {
  const base: GameRecord = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    mode: state.mode,
    level: state.level,
    playerScore: state.scores.player,
  };
  if (state.mode === GameMode.VERSUS) {
    return { ...base, machineScore: state.scores.machine, survivor: state.survivor };
  }
  return base;
}

export interface RecordsByMode {
  [GameMode.SIMPLE]: GameRecord[];
  [GameMode.VERSUS]: GameRecord[];
}

/** Split records into the Simple and Versus buckets (each tab's data source). */
export function groupByMode(records: GameRecord[]): RecordsByMode {
  return {
    [GameMode.SIMPLE]: records.filter((r) => r.mode === GameMode.SIMPLE),
    [GameMode.VERSUS]: records.filter((r) => r.mode === GameMode.VERSUS),
  };
}
