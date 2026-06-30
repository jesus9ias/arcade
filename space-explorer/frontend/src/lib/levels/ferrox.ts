import type { LevelConfig } from './types';
import { WorldType } from '../constants';
import {
  composeHeightmap,
  segmentCenter,
  segmentStarts,
  type TerrainSegment,
} from './builder';

// Level 11 — Ferrox. Dense metal-rich world with two lakes and both tools. Five
// samples: two on land, two on lake floors (turbines), one buried (laser).

const SEGMENTS: TerrainSegment[] = [
  { width: 80, from: 180 }, // 0: flat (sample 1, land)
  { width: 110, from: 180, to: 320 }, // 1: rise
  { width: 110, from: 320, to: 150 }, // 2: down
  { width: 80, from: 150 }, // 3: plateau (sample 5, subsurface)
  { width: 110, from: 150, to: 80 }, // 4: into lake A
  { width: 190, from: 80 }, // 5: lake A floor (sample 3, underwater)
  { width: 100, from: 80, to: 190 }, // 6: out of lake A
  { width: 120, from: 190, to: 300 }, // 7: ridge up
  { width: 120, from: 300, to: 160 }, // 8: down
  { width: 70, from: 160 }, // 9: plateau (sample 2, land)
  { width: 110, from: 160, to: 90 }, // 10: into lake B
  { width: 200, from: 90 }, // 11: lake B floor (sample 4, underwater)
  { width: 100, from: 90, to: 190 }, // 12: out of lake B
  { width: 110, from: 190 }, // 13: open flat tail
];

const STARTS = segmentStarts(SEGMENTS);

export const FERROX: LevelConfig = {
  id: 11,
  name: 'Ferrox',
  worldType: WorldType.METALLIC,
  distanceFromEarth: '72.3 light years',
  gravity: 1.3,
  fuel: 1800,
  electricity: 600,
  tools: { laser: true, waterTurbines: true },
  heightmap: composeHeightmap(SEGMENTS),
  waterZones: [
    { startColumn: STARTS[4], endColumn: STARTS[7] - 1, surfaceHeight: 140 },
    { startColumn: STARTS[10], endColumn: STARTS[13] - 1, surfaceHeight: 160 },
  ],
  samples: [
    { id: 'ferrox-1', columnIndex: segmentCenter(SEGMENTS, 0), subsurface: false },
    { id: 'ferrox-2', columnIndex: segmentCenter(SEGMENTS, 9), subsurface: false },
    { id: 'ferrox-3', columnIndex: segmentCenter(SEGMENTS, 5), subsurface: false },
    { id: 'ferrox-4', columnIndex: segmentCenter(SEGMENTS, 11), subsurface: false },
    // Buried under the first plateau — laser it open.
    { id: 'ferrox-5', columnIndex: segmentCenter(SEGMENTS, 3), subsurface: true },
  ],
  theme: {
    skyColorTop: '#1a1410',
    skyColorBottom: '#4a3a2a',
    groundColor: '#7a6a5a',
    waterColor: '#5a6a7a',
  },
};
