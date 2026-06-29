import { describe, it, expect } from 'vitest';
import {
  getHeight,
  isFlatZone,
  isValidLandingZone,
  detectTerrainCollision,
  isUnderwater,
} from '../terrain';
import { SCENE_HEIGHT, ROVER_WIDTH, ROVER_HEIGHT, PropulsorMode } from '../../constants';
import type { RoverState } from '../../constants';
import type { WaterZone } from '../../levels';

// Stage 2 failing tests — terrain (T-TER-*). Implementation arrives in Stage 3.
// Convention: 1 column = 1 game unit horizontally; heightmap values are game
// units measured from the bottom of the fixed-height scene (SCENE_HEIGHT).

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

const flat = (height: number, columns: number): number[] => Array(columns).fill(height);

describe('terrain — heightmap', () => {
  it('T-TER-01: height at a column is returned correctly', () => {
    expect(getHeight([10, 20, 30, 40], 2)).toBe(30);
  });

  it('T-TER-02: a flat zone is detected when consecutive columns share a height', () => {
    expect(isFlatZone(flat(100, 50), 10, ROVER_WIDTH)).toBe(true);
  });

  it('T-TER-03: a non-flat zone is not detected as flat', () => {
    const hm = [100, 100, 100, 105, 100];
    expect(isFlatZone(hm, 0, 5)).toBe(false);
  });

  it('T-TER-04: a flat zone narrower than ROVER_WIDTH is not a valid landing zone', () => {
    // A plateau too narrow for the rover, flanked by higher walls.
    const plateauStart = 20;
    const plateauWidth = ROVER_WIDTH - 2;
    const hm = flat(150, 60);
    for (let i = plateauStart; i < plateauStart + plateauWidth; i++) hm[i] = 100;
    const center = plateauStart + Math.floor(plateauWidth / 2);
    expect(isValidLandingZone(hm, center, ROVER_WIDTH)).toBe(false);
  });
});

describe('terrain — collision', () => {
  it('T-TER-05: collision detected when the rover bottom reaches the terrain', () => {
    const hm = flat(100, 60);
    // rover bottom edge 5 units below the terrain surface (from-bottom space)
    const y = SCENE_HEIGHT - 100 - ROVER_HEIGHT + 5;
    expect(detectTerrainCollision(makeRover({ position: { x: 10, y } }), hm)).toBe(true);
  });

  it('T-TER-06: no collision when the rover is fully above the terrain', () => {
    const hm = flat(100, 60);
    expect(detectTerrainCollision(makeRover({ position: { x: 10, y: 0 } }), hm)).toBe(false);
  });
});

describe('terrain — water', () => {
  it('T-TER-07: underwater when the rover center is below the water surface', () => {
    const water: WaterZone[] = [{ startColumn: 0, endColumn: 40, surfaceHeight: 200 }];
    // rover center 10 units below the surface (from-bottom space)
    const y = SCENE_HEIGHT - 200 - ROVER_HEIGHT / 2 + 10;
    expect(isUnderwater(makeRover({ position: { x: 10, y } }), water)).toBe(true);
  });
});
