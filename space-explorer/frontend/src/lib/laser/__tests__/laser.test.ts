import { describe, it, expect } from 'vitest';
import { fireLaser, exposeSubsurfaceSamples } from '../laser';
import { LASER_WIDTH, LASER_DEPTH } from '../../constants';
import type { SampleState } from '../../constants';

// Stage 5 sub-step 2 — laser (T-LAS-*). Pure terrain mutation + sample exposure.

const flat = (height: number, length = 100): number[] => new Array(length).fill(height);

const makeSample = (over: Partial<SampleState> = {}): SampleState => ({
  id: 's',
  columnIndex: 50,
  subsurface: true,
  exposed: false,
  collected: false,
  ...over,
});

describe('laser — terrain mutation', () => {
  it('T-LAS-01: beam columns are lowered by LASER_DEPTH', () => {
    const next = fireLaser(flat(200), 50);
    expect(next[50]).toBe(200 - LASER_DEPTH);
  });

  it('T-LAS-02: columns outside the beam are unchanged', () => {
    const next = fireLaser(flat(200), 50);
    expect(next[0]).toBe(200);
    expect(next[99]).toBe(200);
  });

  it('T-LAS-03: lowered height clamps at 0', () => {
    const next = fireLaser(flat(30), 50);
    expect(next[50]).toBe(0);
  });

  it('T-LAS-04: the input heightmap is not mutated', () => {
    const original = flat(200);
    const next = fireLaser(original, 50);
    expect(next).not.toBe(original);
    expect(original[50]).toBe(200);
  });

  it('carves exactly LASER_WIDTH columns', () => {
    const next = fireLaser(flat(200), 50);
    const lowered = next.filter((h) => h === 200 - LASER_DEPTH).length;
    expect(lowered).toBe(LASER_WIDTH);
  });
});

describe('laser — sample exposure', () => {
  it('T-LAS-05: a subsurface sample within the beam becomes exposed', () => {
    const next = exposeSubsurfaceSamples([makeSample({ columnIndex: 50 })], 50);
    expect(next[0].exposed).toBe(true);
  });

  it('T-LAS-06: a subsurface sample outside the beam stays unexposed', () => {
    const next = exposeSubsurfaceSamples([makeSample({ columnIndex: 50 })], 5);
    expect(next[0].exposed).toBe(false);
  });

  it('T-LAS-07: a surface (non-subsurface) sample is untouched', () => {
    const surface = makeSample({ subsurface: false, exposed: true, columnIndex: 50 });
    const next = exposeSubsurfaceSamples([surface], 50);
    expect(next[0]).toEqual(surface);
  });
});
