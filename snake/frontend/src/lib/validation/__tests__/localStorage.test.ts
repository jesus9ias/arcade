import { describe, it, expect } from 'vitest';
import { validatePrefs, validateHistory } from '../localStorage';

// Stage 2 failing tests — validation/localStorage (T-LS-*). Implementation arrives in Stage 3.

const makeRecord = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString(),
  mode: 'VERSUS',
  level: 4,
  playerScore: 120,
  machineScore: 90,
  survivor: 'player',
  ...overrides,
});

describe('validation/localStorage — snake_prefs', () => {
  it('T-LS-01: valid prefs pass', () => {
    expect(validatePrefs({ language: 'en', theme: 'dark', mode: 'SIMPLE' }).ok).toBe(
      true,
    );
  });

  it('T-LS-02: an invalid theme value fails', () => {
    expect(validatePrefs({ language: 'en', theme: 'blue', mode: 'SIMPLE' }).ok).toBe(
      false,
    );
  });

  it('T-LS-03: an invalid mode value fails', () => {
    expect(validatePrefs({ language: 'en', theme: 'dark', mode: 'X' }).ok).toBe(false);
  });

  it('T-LS-04: tampered (non-JSON) input fails', () => {
    expect(validatePrefs('{{not json}}').ok).toBe(false);
  });
});

describe('validation/localStorage — snake_history', () => {
  it('T-LS-05: a valid history array passes', () => {
    expect(validateHistory([makeRecord()]).ok).toBe(true);
  });

  it('T-LS-06: a record with a missing field is discarded, valid ones preserved', () => {
    const result = validateHistory([makeRecord(), makeRecord({ id: undefined })]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
  });

  it('T-LS-07: a non-array history value fails', () => {
    expect(validateHistory('not an array').ok).toBe(false);
  });
});
