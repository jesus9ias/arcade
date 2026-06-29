// Pure level-progression logic. Unlock status is derived (not stored): level 1 is
// always unlocked; every other level unlocks once the previous one is completed.

import type { LevelConfig } from '../levels';
import { updateBestTime } from '../mission/mission';

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  bestTimeMs: number | null; // null = never completed
}

/** Initial progress: a record per level, none completed. */
export function createInitialProgress(levels: ReadonlyArray<LevelConfig>): LevelProgress[] {
  return levels.map((level) => ({
    levelId: level.id,
    completed: false,
    bestTimeMs: null,
  }));
}

/**
 * Records a successful completion: marks the level completed and keeps the best
 * (smallest) time. Unknown level ids leave progress unchanged.
 */
export function applyCompletion(
  progress: LevelProgress[],
  levelId: number,
  timeMs: number,
): LevelProgress[] {
  return progress.map((record) =>
    record.levelId === levelId
      ? {
          ...record,
          completed: true,
          bestTimeMs: updateBestTime(record.bestTimeMs, timeMs),
        }
      : record,
  );
}

/** True when a level is playable: the first level, or the previous one is done. */
export function isLevelUnlocked(progress: LevelProgress[], levelId: number): boolean {
  const ids = progress.map((record) => record.levelId);
  const firstId = Math.min(...ids);
  if (levelId === firstId) return true;
  const previous = progress.find((record) => record.levelId === levelId - 1);
  return previous?.completed ?? false;
}
