import { describe, it, expect } from 'vitest';
import { createLockState, advance, hasExpired, canReset, reset } from '../lock';

// Spec constants (Game Rules → Lock delay).
const LOCK_DELAY_MS = 500;
const MAX_LOCK_RESETS = 15;

describe('T-LOCK lock delay', () => {
  it('T-LOCK-01 a resting piece expires after LOCK_DELAY_MS of accumulated dt', () => {
    expect(hasExpired(advance(createLockState(), LOCK_DELAY_MS))).toBe(true);
    expect(hasExpired(advance(createLockState(), LOCK_DELAY_MS - 1))).toBe(false);
  });

  it('T-LOCK-02 a move/rotation resets the timer and counts toward the cap', () => {
    const l = reset(advance(createLockState(), 400));
    expect(l.elapsedMs).toBe(0);
    expect(l.resets).toBe(1);
  });

  it('T-LOCK-03 force-lock once the reset cap is exhausted', () => {
    let l = createLockState();
    for (let i = 0; i < MAX_LOCK_RESETS; i++) l = reset(advance(l, 100));
    expect(l.resets).toBe(MAX_LOCK_RESETS);
    expect(canReset(l)).toBe(false);
    // a further reset cannot wipe an expiry away
    l = reset(advance(l, LOCK_DELAY_MS));
    expect(hasExpired(l)).toBe(true);
  });
});
