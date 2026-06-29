// Pure mission rules: sample collection, landing safety, escape detection and
// best-time comparison. No DOM, no timers, no randomness.

import { MAX_LANDING_SPEED, MAX_LANDING_LATERAL_SPEED } from '../constants';
import type { RoverState, SampleState } from '../constants';

/**
 * Marks the sample whose flat zone matches `landingColumn` as collected. Samples
 * are immutable once collected; columns with no sample leave the list unchanged.
 */
export function tryCollectSample(
  samples: SampleState[],
  landingColumn: number,
): SampleState[] {
  return samples.map((sample) =>
    !sample.collected && sample.columnIndex === landingColumn
      ? { ...sample, collected: true }
      : sample,
  );
}

/** True when every sample on the level has been collected. */
export function allSamplesCollected(samples: SampleState[]): boolean {
  return samples.length > 0 && samples.every((sample) => sample.collected);
}

/** True when descent and lateral speeds are both within the safe-landing limits. */
export function isLandingSafe(vy: number, vx: number): boolean {
  return vy <= MAX_LANDING_SPEED && Math.abs(vx) <= MAX_LANDING_LATERAL_SPEED;
}

/** True once the rover's top edge has crossed above the top of the scene. */
export function hasEscaped(rover: RoverState): boolean {
  return rover.position.y < 0;
}

/** Returns the better (smaller) of an existing best time and a new candidate. */
export function updateBestTime(current: number | null, candidate: number): number {
  return current === null ? candidate : Math.min(current, candidate);
}
