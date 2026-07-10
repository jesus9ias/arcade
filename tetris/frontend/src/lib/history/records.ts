// Match-history records. Pure builders and reducers; localStorage I/O lives in
// the controller.

import { HISTORY_LIMIT } from '../constants/storage';

export { HISTORY_LIMIT } from '../constants/storage';

export type GameOutcome = 'GAME_OVER' | 'VICTORY';

export interface GameRecord {
  id: string;
  date: string; // ISO
  startLevel: number;
  endLevel: number;
  linesCleared: number;
  score: number;
  regularPoints: number;
  bonusPoints: number;
  durationMs: number;
  outcome: GameOutcome;
}

export interface Scores {
  records: GameRecord[]; // ≤ HISTORY_LIMIT, most recent first
  best: GameRecord | null; // pinned; never pruned
}

export type BuildRecordInput = Omit<GameRecord, 'score'>;

export function buildRecord(input: BuildRecordInput): GameRecord {
  return { ...input, score: input.regularPoints + input.bonusPoints };
}

// Prepend the newest run, cap the list, and keep the all-time best pinned.
export function addRecord(scores: Scores, record: GameRecord): Scores {
  const records = [record, ...scores.records].slice(0, HISTORY_LIMIT);
  const best = !scores.best || record.score > scores.best.score ? record : scores.best;
  return { records, best };
}

export function clearHistory(): Scores {
  return { records: [], best: null };
}
