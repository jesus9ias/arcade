import type { LevelConfig } from './types';
import { WorldType, SampleShape } from '../constants';
import { composeHeightmap, segmentCenter, type TerrainSegment } from './builder';

// Level 7 — Cavus. Cratered barren world, no water. The laser is the puzzle:
// three samples on land and one buried under the central plateau (fire `x` to
// carve a pit, drop in, land gently on the floor).

const SEGMENTS: TerrainSegment[] = [
  { width: 70, from: 200 }, // 0: flat (sample 1)
  { width: 130, from: 200, to: 360 }, // 1: rise
  { width: 130, from: 360, to: 180 }, // 2: down
  { width: 70, from: 180 }, // 3: flat (sample 2)
  { width: 120, from: 180, to: 150 }, // 4: gentle slope
  { width: 80, from: 150 }, // 5: plateau (sample 4, subsurface)
  { width: 120, from: 150, to: 300 }, // 6: rise
  { width: 130, from: 300, to: 170 }, // 7: down
  { width: 70, from: 170 }, // 8: flat (sample 3)
  { width: 120, from: 170, to: 230 }, // 9: tail rise
  { width: 100, from: 230 }, // 10: open flat tail
];

export const CAVUS: LevelConfig = {
  id: 7,
  name: 'Cavus',
  worldType: WorldType.BARREN,
  distanceFromEarth: '41.2 light years',
  gravity: 1.2,
  fuel: 1500,
  electricity: 0,
  tools: { laser: true, waterTurbines: false },
  heightmap: composeHeightmap(SEGMENTS),
  waterZones: [],
  samples: [
    { id: 'cavus-1', columnIndex: segmentCenter(SEGMENTS, 0), subsurface: false, shape: SampleShape.ROCK },
    { id: 'cavus-2', columnIndex: segmentCenter(SEGMENTS, 3), subsurface: false, shape: SampleShape.ROCK },
    { id: 'cavus-3', columnIndex: segmentCenter(SEGMENTS, 8), subsurface: false, shape: SampleShape.ROCK },
    // Buried under the central plateau — carve a pit with the laser.
    { id: 'cavus-4', columnIndex: segmentCenter(SEGMENTS, 5), subsurface: true, shape: SampleShape.NUGGET },
  ],
  theme: {
    skyColorTop: '#0a0a12',
    skyColorBottom: '#2a2a3a',
    groundColor: '#6a6a72',
    waterColor: '#3a3a44',
  },
};
