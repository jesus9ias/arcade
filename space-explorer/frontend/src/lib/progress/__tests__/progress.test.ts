import { describe, it, expect } from 'vitest';
import { createInitialProgress, applyCompletion, isLevelUnlocked } from '../progress';
import type { LevelConfig } from '../../levels';

// Stage 2 failing tests — progress (T-PRG-*). Implementation arrives in Stage 3.

const makeLevel = (id: number): LevelConfig => ({
  id,
  name: `Level ${id}`,
  distanceFromEarth: '1 light year',
  gravity: 1,
  fuel: 1000,
  electricity: 0,
  tools: { laser: false, waterTurbines: false },
  heightmap: [],
  waterZones: [],
  samples: [],
  theme: {
    skyColorTop: '#000010',
    skyColorBottom: '#101030',
    groundColor: '#203020',
    waterColor: '#102030',
  },
});

const levels = [makeLevel(1), makeLevel(2), makeLevel(3)];

describe('progress', () => {
  it('T-PRG-01: initial progress unlocks only level 1', () => {
    const progress = createInitialProgress(levels);
    expect(isLevelUnlocked(progress, 1)).toBe(true);
    expect(isLevelUnlocked(progress, 2)).toBe(false);
    expect(isLevelUnlocked(progress, 3)).toBe(false);
  });

  it('T-PRG-02: completing level N unlocks N+1', () => {
    const progress = applyCompletion(createInitialProgress(levels), 1, 80000);
    expect(isLevelUnlocked(progress, 2)).toBe(true);
  });

  it('T-PRG-03: first completion records the best time', () => {
    const progress = applyCompletion(createInitialProgress(levels), 1, 80000);
    expect(progress.find((r) => r.levelId === 1)?.bestTimeMs).toBe(80000);
  });

  it('T-PRG-04: a better time updates the best', () => {
    let progress = applyCompletion(createInitialProgress(levels), 1, 80000);
    progress = applyCompletion(progress, 1, 60000);
    expect(progress.find((r) => r.levelId === 1)?.bestTimeMs).toBe(60000);
  });

  it('T-PRG-05: a slower time does not update the best', () => {
    let progress = applyCompletion(createInitialProgress(levels), 1, 80000);
    progress = applyCompletion(progress, 1, 100000);
    expect(progress.find((r) => r.levelId === 1)?.bestTimeMs).toBe(80000);
  });

  it('T-PRG-06: completing the last level unlocks nothing new', () => {
    const progress = applyCompletion(createInitialProgress(levels), 3, 50000);
    expect(progress).toHaveLength(3);
  });
});
