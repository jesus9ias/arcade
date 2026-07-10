import { describe, it, expect } from 'vitest';
import { validatePrefs, validateScores } from '../localStorage';

const validRecord = {
  id: 'a',
  date: '2026-07-09T00:00:00.000Z',
  startLevel: 1,
  endLevel: 1,
  linesCleared: 1,
  score: 1,
  regularPoints: 1,
  bonusPoints: 0,
  durationMs: 1,
  outcome: 'GAME_OVER',
};

describe('T-LS localStorage validation', () => {
  it('T-LS-01 valid preferences pass', () => {
    const r = validatePrefs(JSON.stringify({ language: 'en', muted: false, startLevel: 3 }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ language: 'en', muted: false, startLevel: 3 });
  });

  it('T-LS-02 an invalid language or mute flag fails', () => {
    expect(validatePrefs(JSON.stringify({ language: 'fr', muted: false, startLevel: 1 })).ok).toBe(false);
    expect(validatePrefs(JSON.stringify({ language: 'en', muted: 'no', startLevel: 1 })).ok).toBe(false);
  });

  it('T-LS-03 the starting level is clamped to 1..15', () => {
    const hi = validatePrefs(JSON.stringify({ language: 'en', muted: false, startLevel: 99 }));
    expect(hi.ok).toBe(true);
    if (hi.ok) expect(hi.value.startLevel).toBe(15);
    const lo = validatePrefs(JSON.stringify({ language: 'en', muted: false, startLevel: 0 }));
    expect(lo.ok).toBe(true);
    if (lo.ok) expect(lo.value.startLevel).toBe(1);
  });

  it('T-LS-04 tampered JSON (or null) is rejected', () => {
    expect(validatePrefs('{{not json}}').ok).toBe(false);
    expect(validatePrefs(null).ok).toBe(false);
  });

  it('T-LS-05 invalid scores are discarded; bad records are filtered', () => {
    expect(validateScores(JSON.stringify({ records: 'nope', best: null })).ok).toBe(false);
    const good = validateScores(
      JSON.stringify({ records: [validRecord, { garbage: true }], best: null }),
    );
    expect(good.ok).toBe(true);
    if (good.ok) expect(good.value.records.length).toBe(1);
  });
});
