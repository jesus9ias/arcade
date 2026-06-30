// Pure laser tool: terrain mutation and subsurface-sample exposure. No DOM, no
// timers, no randomness. The laser carves a flat pit straight down under the
// rover and exposes any buried subsurface sample inside the beam.

import { LASER_WIDTH, LASER_DEPTH } from '../constants';
import type { SampleState } from '../constants';

/** Half-open column range [start, end) of a beam centered on `centerColumn`. */
function beamRange(centerColumn: number): { start: number; end: number } {
  const start = centerColumn - Math.floor(LASER_WIDTH / 2);
  return { start, end: start + LASER_WIDTH };
}

/**
 * Returns a new heightmap with the `LASER_WIDTH` columns centered on
 * `centerColumn` lowered by `LASER_DEPTH` (clamped at 0). The input is not mutated.
 */
export function fireLaser(heightmap: number[], centerColumn: number): number[] {
  const { start, end } = beamRange(centerColumn);
  return heightmap.map((height, column) =>
    column >= start && column < end ? Math.max(0, height - LASER_DEPTH) : height,
  );
}

/**
 * Marks every subsurface sample whose column falls inside the beam as exposed.
 * Surface samples and samples outside the beam are returned unchanged.
 */
export function exposeSubsurfaceSamples(
  samples: SampleState[],
  centerColumn: number,
): SampleState[] {
  const { start, end } = beamRange(centerColumn);
  return samples.map((sample) =>
    sample.subsurface && sample.columnIndex >= start && sample.columnIndex < end
      ? { ...sample, exposed: true }
      : sample,
  );
}
