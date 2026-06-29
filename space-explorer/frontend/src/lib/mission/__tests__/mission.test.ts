import { describe, it, expect } from 'vitest';
import {
  tryCollectSample,
  allSamplesCollected,
  isLandingSafe,
  hasEscaped,
  updateBestTime,
} from '../mission';
import { MAX_LANDING_SPEED, MAX_LANDING_LATERAL_SPEED, PropulsorMode } from '../../constants';
import type { SampleState, RoverState } from '../../constants';

// Stage 2 failing tests — mission (T-MSN-*). Implementation arrives in Stage 3.

const makeSample = (over: Partial<SampleState> = {}): SampleState => ({
  id: 's1',
  columnIndex: 10,
  subsurface: false,
  collected: false,
  ...over,
});

const makeRover = (over: Partial<RoverState> = {}): RoverState => ({
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  fuel: 1000,
  electricity: 0,
  mode: PropulsorMode.PROPULSOR,
  grounded: false,
  underwater: false,
  destroyed: false,
  ...over,
});

describe('mission — samples', () => {
  it('T-MSN-01: landing at a sample column collects it', () => {
    const next = tryCollectSample([makeSample({ columnIndex: 10 })], 10);
    expect(next[0].collected).toBe(true);
  });

  it('T-MSN-02: landing at a non-sample column collects nothing', () => {
    const next = tryCollectSample([makeSample({ columnIndex: 10 })], 99);
    expect(next[0].collected).toBe(false);
  });

  it('T-MSN-03: an already-collected sample is not re-collected', () => {
    const next = tryCollectSample([makeSample({ columnIndex: 10, collected: true })], 10);
    expect(next.filter((s) => s.collected)).toHaveLength(1);
  });

  it('T-MSN-04: allSamplesCollected is true when all are collected', () => {
    const samples = [
      makeSample({ id: 's1', collected: true }),
      makeSample({ id: 's2', collected: true }),
    ];
    expect(allSamplesCollected(samples)).toBe(true);
  });
});

describe('mission — landing', () => {
  it('T-MSN-05: an unsafe landing speed returns false', () => {
    expect(isLandingSafe(MAX_LANDING_SPEED + 1, 0)).toBe(false);
  });

  it('T-MSN-06: a safe landing speed returns true', () => {
    expect(isLandingSafe(MAX_LANDING_SPEED, MAX_LANDING_LATERAL_SPEED)).toBe(true);
  });
});

describe('mission — escape and best time', () => {
  it('T-MSN-07: escape detected when the rover top exits the scene top', () => {
    expect(hasEscaped(makeRover({ position: { x: 0, y: -1 } }))).toBe(true);
  });

  it('T-MSN-08: a better time replaces the existing best', () => {
    expect(updateBestTime(120000, 95000)).toBe(95000);
  });

  it('T-MSN-09: a slower time does not replace the best', () => {
    expect(updateBestTime(95000, 120000)).toBe(95000);
  });

  it('T-MSN-10: any time replaces a null best', () => {
    expect(updateBestTime(null, 80000)).toBe(80000);
  });
});
