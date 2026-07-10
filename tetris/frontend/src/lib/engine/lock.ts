// Lock-delay bookkeeping. Pure and dt-driven: the caller injects elapsed time;
// nothing reads a clock here.

import { LOCK_DELAY_MS, MAX_LOCK_RESETS } from '../constants/game';

export interface LockState {
  elapsedMs: number; // time accrued while the piece rests
  resets: number; // move/rotation resets used
}

export function createLockState(): LockState {
  return { elapsedMs: 0, resets: 0 };
}

export function advance(lock: LockState, dt: number): LockState {
  return { ...lock, elapsedMs: lock.elapsedMs + dt };
}

export function hasExpired(lock: LockState): boolean {
  return lock.elapsedMs >= LOCK_DELAY_MS;
}

export function canReset(lock: LockState): boolean {
  return lock.resets < MAX_LOCK_RESETS;
}

// A successful move/rotation restarts the timer, up to the reset cap.
export function reset(lock: LockState): LockState {
  if (!canReset(lock)) return lock;
  return { elapsedMs: 0, resets: lock.resets + 1 };
}
