import { describe, it, expect } from 'vitest';
import { validatePlayerName } from '../playerName';

// Stage 2 failing tests — validation/playerName (T-NAME-*). Implementation arrives in Stage 3.

describe('validation/playerName', () => {
  it('T-NAME-01: a valid name passes and is trimmed', () => {
    expect(validatePlayerName('  Jesús  ')).toEqual({ ok: true, value: 'Jesús' });
  });

  it('T-NAME-02: an empty name fails', () => {
    expect(validatePlayerName('').ok).toBe(false);
  });

  it('T-NAME-03: a whitespace-only name fails', () => {
    expect(validatePlayerName('   ').ok).toBe(false);
  });

  it('T-NAME-04: a name longer than 30 characters fails', () => {
    expect(validatePlayerName('a'.repeat(31)).ok).toBe(false);
  });

  it('T-NAME-05: a name containing a script tag fails', () => {
    expect(validatePlayerName('<script>alert(1)</script>').ok).toBe(false);
  });
});
