import type { LevelConfig } from './types';
import { WorldType } from '../constants';
import {
  composeHeightmap,
  segmentCenter,
  segmentStarts,
  type TerrainSegment,
} from './builder';

// Level 9 — Crystalis. Mineral world of crystal ridges with both tools. Two land
// samples, one buried (laser), one on a lake floor (turbines).

const SEGMENTS: TerrainSegment[] = [
  { width: 80, from: 190 }, // 0: flat (sample 1, land)
  { width: 120, from: 190, to: 350 }, // 1: crystal ridge up
  { width: 120, from: 350, to: 150 }, // 2: down
  { width: 80, from: 150 }, // 3: plateau (sample 3, subsurface)
  { width: 120, from: 150, to: 90 }, // 4: into the lake
  { width: 200, from: 90 }, // 5: lake floor (sample 4, underwater)
  { width: 110, from: 90, to: 200 }, // 6: out of the lake
  { width: 120, from: 200, to: 320 }, // 7: ridge up
  { width: 120, from: 320, to: 170 }, // 8: down
  { width: 70, from: 170 }, // 9: flat (sample 2, land)
  { width: 120, from: 170, to: 240 }, // 10: tail rise
  { width: 100, from: 240 }, // 11: open flat tail
];

const STARTS = segmentStarts(SEGMENTS);

export const CRYSTALIS: LevelConfig = {
  id: 9,
  name: 'Crystalis',
  worldType: WorldType.CRYSTALLINE,
  distanceFromEarth: '55.1 light years',
  gravity: 1.3,
  fuel: 1600,
  electricity: 450,
  tools: { laser: true, waterTurbines: true },
  heightmap: composeHeightmap(SEGMENTS),
  waterZones: [{ startColumn: STARTS[4], endColumn: STARTS[7] - 1, surfaceHeight: 150 }],
  samples: [
    { id: 'crystalis-1', columnIndex: segmentCenter(SEGMENTS, 0), subsurface: false },
    { id: 'crystalis-2', columnIndex: segmentCenter(SEGMENTS, 9), subsurface: false },
    // Buried under the second plateau — laser it open.
    { id: 'crystalis-3', columnIndex: segmentCenter(SEGMENTS, 3), subsurface: true },
    // On the lake floor — dive with the turbines.
    { id: 'crystalis-4', columnIndex: segmentCenter(SEGMENTS, 5), subsurface: false },
  ],
  theme: {
    skyColorTop: '#14082a',
    skyColorBottom: '#5a2a8b',
    groundColor: '#8a7ab0',
    waterColor: '#6f7fd6',
  },
};
