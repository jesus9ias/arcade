import { describe, it, expect } from 'vitest';
import { fruitsRequired, speedForLevel } from '../level';
import { advanceTick } from '../../engine/engine';
import type { GameState, Snake, Fruit } from '../../engine/engine';
import { GameStatus, GameMode, BASE_SPEED_MS, SPEED_GROWTH } from '../../constants';
import type { Position } from '../../constants';

// Stage 2 failing tests — level (T-LVL-*). Implementation arrives in Stage 3.

const P = (x: number, y: number): Position => ({ x, y });

const makeSnake = (over: Partial<Snake> = {}): Snake => ({
  id: 'player',
  body: [P(3, 5), P(2, 5), P(1, 5)],
  direction: 'RIGHT',
  pendingTurn: null,
  pendingGrowth: 0,
  alive: true,
  ...over,
});

const makeFruit = (over: Partial<Fruit> = {}): Fruit => ({
  id: 'f',
  type: 'CHERRY',
  position: P(4, 5),
  spawnTick: 0,
  isBonus: false,
  ...over,
});

// One regular fruit short of the level requirement, with a fruit directly ahead.
const aboutToLevelUp = (over: Partial<GameState> = {}): GameState => ({
  status: GameStatus.PLAYING,
  mode: GameMode.SIMPLE,
  level: 1,
  tick: 0,
  snakes: [makeSnake()],
  fruits: [makeFruit()],
  obstacles: [],
  scores: { player: 0, machine: 0 },
  fruitsEatenThisLevel: 11,
  fruitsRequiredThisLevel: 12,
  efficiencyStreak: 0,
  boosted: false,
  speedMs: 140,
  survivor: null,
  ...over,
});

describe('level — fruitsRequired', () => {
  it('T-LVL-01: level 1 requires the base count of regular fruits', () => {
    expect(fruitsRequired(1)).toBe(12);
  });

  it('T-LVL-02: the requirement floors at the minimum for high levels', () => {
    expect(fruitsRequired(100)).toBe(4);
  });
});

describe('level — speedForLevel', () => {
  it('T-LVL-03: the tick interval shortens 10% per level', () => {
    expect(speedForLevel(2)).toBe(Math.round(BASE_SPEED_MS / SPEED_GROWTH));
  });
});

describe('level — progression via the engine', () => {
  it('T-LVL-04: eating the required regular fruit advances the level and resets the counter', () => {
    const next = advanceTick(aboutToLevelUp());
    expect(next.level).toBe(2);
    expect(next.fruitsEatenThisLevel).toBe(0);
  });

  it('T-LVL-05: a golden fruit does not count toward the level requirement', () => {
    const next = advanceTick(
      aboutToLevelUp({ fruits: [makeFruit({ id: 'g', isBonus: true })] }),
    );
    expect(next.level).toBe(1);
    expect(next.fruitsEatenThisLevel).toBe(11);
  });
});
