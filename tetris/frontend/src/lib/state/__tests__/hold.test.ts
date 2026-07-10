import { describe, it, expect } from 'vitest';
import { applyHold } from '../hold';
import { createPiece } from '../../engine/piece';
import type { HoldContext } from '../hold';

const base = (): HoldContext => ({
  active: createPiece('T'),
  hold: null,
  queue: ['I', 'O', 'S', 'Z'],
  holdsRemaining: 10,
  holdUsedThisPiece: false,
});

describe('T-HOLD hold slot', () => {
  it('T-HOLD-01 the first hold stores the active piece and pulls from the queue', () => {
    const s = applyHold(base());
    expect(s.hold).toBe('T');
    expect(s.active.type).toBe('I');
    expect(s.queue).toEqual(['O', 'S', 'Z']);
    expect(s.holdsRemaining).toBe(9);
    expect(s.holdUsedThisPiece).toBe(true);
  });

  it('T-HOLD-02 holding twice before the piece locks is ignored', () => {
    const s: HoldContext = { ...base(), holdUsedThisPiece: true };
    expect(applyHold(s)).toBe(s);
  });

  it('T-HOLD-03 hold is disabled once no uses remain', () => {
    const s: HoldContext = { ...base(), holdsRemaining: 0 };
    expect(applyHold(s)).toBe(s);
  });
});
