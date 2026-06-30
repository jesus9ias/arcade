export * from './types';
export { composeHeightmap, segmentCenter, segmentStarts } from './builder';
export type { TerrainSegment } from './builder';

import type { LevelConfig } from './types';
import { VERDANIA } from './verdania';
import { FERRUM } from './ferrum';
import { GLACIUS } from './glacius';
import { ARIDUS } from './aridus';
import { CALDERA } from './caldera';
import { MARIS } from './maris';
import { CAVUS } from './cavus';
import { TOXINA } from './toxina';
import { CRYSTALIS } from './crystalis';
import { PROCELLA } from './procella';
import { FERROX } from './ferrox';
import { TERMINUS } from './terminus';

/** All playable levels, in unlock order. Adding a planet = adding a config here. */
export const LEVELS: ReadonlyArray<LevelConfig> = [
  VERDANIA,
  FERRUM,
  GLACIUS,
  ARIDUS,
  CALDERA,
  MARIS,
  CAVUS,
  TOXINA,
  CRYSTALIS,
  PROCELLA,
  FERROX,
  TERMINUS,
];

export {
  VERDANIA,
  FERRUM,
  GLACIUS,
  ARIDUS,
  CALDERA,
  MARIS,
  CAVUS,
  TOXINA,
  CRYSTALIS,
  PROCELLA,
  FERROX,
  TERMINUS,
};

/** Returns the level with the given id, or undefined when none matches. */
export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS.find((level) => level.id === id);
}

/** The last (highest-id) level; used to detect end-of-game. */
export function lastLevelId(): number {
  return LEVELS[LEVELS.length - 1].id;
}
