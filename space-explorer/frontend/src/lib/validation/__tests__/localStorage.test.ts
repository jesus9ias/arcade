import { describe, it, expect } from 'vitest';
import { validatePrefs, validateProgress } from '../localStorage';

// Stage 2 failing tests — validation/localStorage (T-LS-*). Implementation arrives in Stage 3.

describe('validation/localStorage — space_prefs', () => {
  it('T-LS-01: valid prefs pass', () => {
    expect(validatePrefs({ language: 'en', theme: 'dark' }).ok).toBe(true);
  });

  it('T-LS-02: an invalid theme value fails', () => {
    expect(validatePrefs({ language: 'en', theme: 'blue' }).ok).toBe(false);
  });

  it('T-LS-03: tampered (non-JSON) input fails', () => {
    expect(validatePrefs('{{not json}}').ok).toBe(false);
  });
});

describe('validation/localStorage — space_progress', () => {
  it('T-LS-04: a valid progress array passes', () => {
    expect(validateProgress([{ levelId: 1, completed: true, bestTimeMs: 80000 }]).ok).toBe(true);
  });

  it('T-LS-05: an invalid record is discarded, valid ones preserved', () => {
    const result = validateProgress([
      { levelId: 1, completed: true, bestTimeMs: 80000 },
      { completed: true, bestTimeMs: 1000 }, // missing levelId
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
  });

  it('T-LS-06: a non-array progress value fails', () => {
    expect(validateProgress('not an array').ok).toBe(false);
  });
});
