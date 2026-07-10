import { describe, it, expect } from 'vitest';
import { buildRecord, addRecord, clearHistory, HISTORY_LIMIT } from '../records';
import type { GameRecord, Scores } from '../records';

const rec = (over: Partial<GameRecord> = {}): GameRecord =>
  buildRecord({
    id: 'x',
    date: '2026-07-09T00:00:00.000Z',
    startLevel: 1,
    endLevel: 2,
    linesCleared: 10,
    regularPoints: 100,
    bonusPoints: 400,
    durationMs: 1000,
    outcome: 'GAME_OVER',
    ...over,
  });

describe('T-HIST match history', () => {
  it('T-HIST-01 buildRecord captures all fields incl. the bonus/regular split', () => {
    const r = rec();
    expect(r.regularPoints).toBe(100);
    expect(r.bonusPoints).toBe(400);
    expect(r.score).toBe(500); // score = regular + bonus
    expect(r.outcome).toBe('GAME_OVER');
    expect(r.startLevel).toBe(1);
    expect(r.endLevel).toBe(2);
  });

  it('T-HIST-02 addRecord prepends the newest and caps at the limit', () => {
    let s: Scores = { records: [], best: null };
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) {
      s = addRecord(s, rec({ id: String(i), regularPoints: i, bonusPoints: 0 }));
    }
    expect(s.records.length).toBe(HISTORY_LIMIT);
    expect(s.records[0].id).toBe(String(HISTORY_LIMIT + 4)); // newest first
  });

  it('T-HIST-03 the all-time best is pinned and survives pruning', () => {
    let s: Scores = { records: [], best: null };
    s = addRecord(s, rec({ id: 'best', regularPoints: 1_000_000, bonusPoints: 0 }));
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) {
      s = addRecord(s, rec({ id: `low-${i}`, regularPoints: 1, bonusPoints: 0 }));
    }
    expect(s.records.length).toBe(HISTORY_LIMIT);
    expect(s.records.find((r) => r.id === 'best')).toBeUndefined(); // dropped from the list
    expect(s.best?.id).toBe('best'); // but still pinned
    expect(s.best?.score).toBe(1_000_000);
  });

  it('T-HIST-04 clearHistory removes every record and the pinned best', () => {
    const s = clearHistory();
    expect(s.records).toEqual([]);
    expect(s.best).toBeNull();
  });
});
