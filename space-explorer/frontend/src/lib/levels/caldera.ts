import type { LevelConfig } from './types';
import { WorldType } from '../constants';
import {
  composeHeightmap,
  segmentCenter,
  segmentStarts,
  type TerrainSegment,
} from './builder';

// Level 5 — Caldera. Volcanic world with a lava lake hazard (no turbines): fall
// in with no fuel and the mission is stuck. Two samples on solid ground, one on
// a narrow ledge above the lava.

const SEGMENTS: TerrainSegment[] = [
  { width: 110, from: 180 }, // 0: flat ground (sample 1)
  { width: 120, from: 180, to: 360 }, // 1: steep ridge up
  { width: 120, from: 360, to: 150 }, // 2: down toward the ledge
  { width: 50, from: 150 }, // 3: narrow ledge above the lava (sample 3)
  { width: 35, from: 150, to: 70 }, // 4: drop into the lava
  { width: 200, from: 70 }, // 5: lava floor
  { width: 35, from: 70, to: 170 }, // 6: climb out
  { width: 120, from: 170, to: 260 }, // 7: rise
  { width: 110, from: 260 }, // 8: flat plateau (sample 2)
  { width: 150, from: 260, to: 170 }, // 9: descent
  { width: 110, from: 170 }, // 10: open flat tail
];

const STARTS = segmentStarts(SEGMENTS);

export const CALDERA: LevelConfig = {
  id: 5,
  name: 'Caldera',
  worldType: WorldType.VOLCANIC,
  distanceFromEarth: '27.4 light years',
  gravity: 1.1,
  fuel: 1000,
  electricity: 0,
  tools: { laser: false, waterTurbines: false },
  heightmap: composeHeightmap(SEGMENTS),
  waterZones: [
    {
      // Lava basin — a hazard, not traversable (no turbines on this world).
      startColumn: STARTS[4],
      endColumn: STARTS[7] - 1,
      surfaceHeight: 120,
    },
  ],
  samples: [
    { id: 'caldera-1', columnIndex: segmentCenter(SEGMENTS, 0), subsurface: false },
    { id: 'caldera-2', columnIndex: segmentCenter(SEGMENTS, 8), subsurface: false },
    { id: 'caldera-3', columnIndex: segmentCenter(SEGMENTS, 3), subsurface: false },
  ],
  theme: {
    skyColorTop: '#2a0a08',
    skyColorBottom: '#6e160c',
    groundColor: '#5a2418',
    waterColor: '#c0391b',
  },
};
