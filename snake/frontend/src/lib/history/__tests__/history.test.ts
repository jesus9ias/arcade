import { describe, it, expect } from 'vitest';
import { buildGameRecord, groupByMode } from '../history';
import type { GameState } from '../../engine/engine';
import { GameStatus, GameMode } from '../../constants';

// Stage 2 failing tests — lib/history (T-HIST-*). Implementation arrives in Stage 3.

const finished = (over: Partial<GameState> = {}): GameState => ({
  status: GameStatus.GAME_OVER,
  mode: GameMode.SIMPLE,
  level: 3,
  tick: 0,
  snakes: [],
  fruits: [],
  obstacles: [],
  scores: { player: 120, machine: 0 },
  fruitsEatenThisLevel: 0,
  fruitsRequiredThisLevel: 12,
  efficiencyStreak: 0,
  boosted: false,
  speedMs: 140,
  survivor: null,
  ...over,
});

const versusOver = (over: Partial<GameState> = {}): GameState =>
  finished({
    mode: GameMode.VERSUS,
    scores: { player: 80, machine: 60 },
    survivor: 'machine',
    ...over,
  });

describe('history — buildGameRecord', () => {
  it('T-HIST-01: a Simple game produces a record with score, level and a valid date', () => {
    const r = buildGameRecord(finished());
    expect(r.mode).toBe(GameMode.SIMPLE);
    expect(r.playerScore).toBe(120);
    expect(r.level).toBe(3);
    expect(Number.isNaN(Date.parse(r.date))).toBe(false);
    expect(typeof r.id).toBe('string');
  });

  it('T-HIST-02: a Versus game records both scores and the survivor', () => {
    const r = buildGameRecord(versusOver());
    expect(r.playerScore).toBe(80);
    expect(r.machineScore).toBe(60);
    expect(r.survivor).toBe('machine');
  });
});

describe('history — groupByMode', () => {
  it('T-HIST-03: separates Simple and Versus records', () => {
    const grouped = groupByMode([
      buildGameRecord(finished()),
      buildGameRecord(versusOver()),
      buildGameRecord(finished()),
    ]);
    expect(grouped[GameMode.SIMPLE]).toHaveLength(2);
    expect(grouped[GameMode.VERSUS]).toHaveLength(1);
  });
});
