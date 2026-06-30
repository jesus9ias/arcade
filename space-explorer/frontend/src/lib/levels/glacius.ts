import type { LevelConfig } from './types';
import { WorldType } from '../constants';
import {
  composeHeightmap,
  segmentCenter,
  segmentStarts,
  type TerrainSegment,
} from './builder';

// Level 3 — Glacius. Jagged ridges with two frozen lakes, high gravity. Three
// land samples on narrow flats, a fourth on the floor of lake A (reached with
// the water turbines), and a fifth buried under the open flat tail — land there
// and fire the laser (`x`) to carve a pit, then drop in and land on the exposed
// floor. Widest scene; the camera tracks the rover.

const SEGMENTS: TerrainSegment[] = [
  { width: 70, from: 220 }, // 0: opening flat (sample 1)
  { width: 120, from: 220, to: 440 }, // 1: ridge up
  { width: 120, from: 440, to: 160 }, // 2: down
  { width: 50, from: 160 }, // 3: narrow flat (sample 2)
  { width: 100, from: 160, to: 90 }, // 4: into shallow lake A
  { width: 180, from: 90 }, // 5: lake A floor (underwater sample)
  { width: 100, from: 90, to: 170 }, // 6: out of lake A
  { width: 120, from: 170, to: 420 }, // 7: ridge up
  { width: 120, from: 420, to: 170 }, // 8: down
  { width: 50, from: 170 }, // 9: narrow flat (sample 3)
  { width: 110, from: 170, to: 70 }, // 10: into deep lake B
  { width: 220, from: 70 }, // 11: lake B floor
  { width: 110, from: 70, to: 190 }, // 12: out of lake B
  { width: 130, from: 190 }, // 13: open flat tail (subsurface sample buried here)
];

const STARTS = segmentStarts(SEGMENTS);

export const GLACIUS: LevelConfig = {
  id: 3,
  name: 'Glacius',
  worldType: WorldType.FROZEN,
  distanceFromEarth: '15.3 light years',
  gravity: 1.3,
  fuel: 1600,
  electricity: 400,
  tools: { laser: true, waterTurbines: true },
  heightmap: composeHeightmap(SEGMENTS),
  waterZones: [
    {
      // Shallow lake A — holds the underwater sample (glacius-4).
      startColumn: STARTS[4],
      endColumn: STARTS[7] - 1,
      surfaceHeight: 150,
    },
    {
      // Deep lake B.
      startColumn: STARTS[10],
      endColumn: STARTS[13] - 1,
      surfaceHeight: 190,
    },
  ],
  samples: [
    { id: 'glacius-1', columnIndex: segmentCenter(SEGMENTS, 0), subsurface: false },
    { id: 'glacius-2', columnIndex: segmentCenter(SEGMENTS, 3), subsurface: false },
    { id: 'glacius-3', columnIndex: segmentCenter(SEGMENTS, 9), subsurface: false },
    // Underwater on the floor of lake A — descend gently with turbines to land.
    // Not subsurface (no laser needed); standard landing mechanics apply.
    { id: 'glacius-4', columnIndex: segmentCenter(SEGMENTS, 5), subsurface: false },
    // Buried under the flat tail — fire the laser to carve a pit, then land in it.
    { id: 'glacius-5', columnIndex: segmentCenter(SEGMENTS, 13), subsurface: true },
  ],
  theme: {
    skyColorTop: '#bfe6f0',
    skyColorBottom: '#7fb6d6',
    groundColor: '#d8e2ea',
    waterColor: '#9fd0e6',
  },
};
