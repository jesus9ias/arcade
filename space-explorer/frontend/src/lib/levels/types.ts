// Level-configuration types. A level is pure data consumed by the engine and
// the renderer; adding a planet requires only a new LevelConfig object.

import type { WorldType, SampleShape } from '../constants';

export interface WaterZone {
  startColumn: number;
  endColumn: number; // inclusive
  surfaceHeight: number; // game units from bottom of scene
}

export interface SampleConfig {
  id: string;
  columnIndex: number; // center column of the flat zone for this sample
  subsurface: boolean; // Phase 2
  shape?: SampleShape; // cosmetic marker shape; defaults to DEFAULT_SAMPLE_SHAPE when unset
}

export interface PlanetTheme {
  skyColorTop: string;
  skyColorBottom: string;
  groundColor: string;
  waterColor: string;
}

export interface LevelConfig {
  id: number; // internal identity / ordering key (persistence, unlock logic); never shown
  name: string;
  designation: string; // illustrative exoplanet-style catalog code shown in the UI (e.g. "XR-12d")
  worldType: WorldType; // drives the level-select icon and info modal
  distanceFromEarth: string; // flavour, e.g. "4.2 light years"
  massEarths: number; // planet mass as a multiple of Earth's (shown in the info modal)
  gravity: number; // multiplier vs Earth
  fuel: number; // initial propulsor fuel
  electricity: number; // initial turbine electricity (0 = no turbines)
  tools: {
    laser: boolean; // Phase 2
    waterTurbines: boolean;
  };
  heightmap: number[]; // height per column (game units from bottom of scene)
  waterZones: WaterZone[];
  samples: SampleConfig[];
  theme: PlanetTheme;
}
