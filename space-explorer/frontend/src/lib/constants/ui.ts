// Presentation constants for the canvas renderer. Pure colors/sizes used by the
// view layer only; game rules never read these.

import { WorldType } from './world';

/**
 * Level-select icon per world type. The Record is exhaustive: adding a WorldType
 * forces a matching icon here, so the catalog never drifts. Used in the level
 * list alongside the `#NNN` level id.
 */
export const WORLD_TYPE_ICON: Record<WorldType, string> = {
  [WorldType.VERDANT]: '🌿',
  [WorldType.VOLCANIC]: '🌋',
  [WorldType.FROZEN]: '❄️',
  [WorldType.DESERT]: '🏜️',
  [WorldType.OCEANIC]: '🌊',
  [WorldType.TOXIC]: '☣️',
  [WorldType.CRYSTALLINE]: '💎',
  [WorldType.BARREN]: '🌑',
  [WorldType.STORM]: '🌩️',
  [WorldType.METALLIC]: '⚙️',
};

/** Fallback icon for a level that declares no world type. */
export const DEFAULT_WORLD_ICON = '🪐';

/** Pixel width the scene is rendered at; the canvas scales game units to fit. */
export const VIEWPORT_WIDTH = 960;

/** Logical render height in pixels (mirrors SCENE_HEIGHT 1:1 for simplicity). */
export const VIEWPORT_HEIGHT = 600;

/** Thruster flame animation length in pixels at full thrust. */
export const FLAME_LENGTH = 16;

/** Radius of a sample marker in game units. */
export const SAMPLE_MARKER_RADIUS = 7;

/** Rover body fill and outline. */
export const ROVER_BODY_COLOR = '#d7dee8';
export const ROVER_OUTLINE_COLOR = '#2b3140';
/** Darker shade for the lander's legs, struts and thruster nozzle. */
export const ROVER_DETAIL_COLOR = '#9aa6b8';
/** Glowing window/sensor on the descent body. */
export const ROVER_WINDOW_COLOR = '#5b8def';
/** Body and detail fills when the rover is destroyed. */
export const ROVER_DESTROYED_BODY_COLOR = '#7a2a2a';
export const ROVER_DESTROYED_DETAIL_COLOR = '#3a1010';
export const FLAME_COLOR = '#ffb347';
export const FLAME_CORE_COLOR = '#fff1b8';
/** Turbine jet colours, used underwater in turbine mode (cooler than the flame). */
export const TURBINE_JET_COLOR = '#7fdfff';
export const TURBINE_JET_CORE_COLOR = '#e6fbff';
/** Marker colour for a buried subsurface sample (not yet exposed by the laser). Natural per-mineral colours live in constants/samples.ts. */
export const SAMPLE_SUBSURFACE_COLOR = '#c084fc';

/** Crash explosion effect (cosmetic, played when the rover is destroyed). */
export const EXPLOSION_DURATION_MS = 850;
export const EXPLOSION_MAX_RADIUS = 46; // px the shockwave / burst reaches at full expansion
export const EXPLOSION_RAY_COUNT = 12; // spikes of the star-burst
export const EXPLOSION_PARTICLE_COUNT = 16; // flying debris particles
export const EXPLOSION_CORE_COLOR = '#fff1b8'; // bright central flash
export const EXPLOSION_FLAME_COLOR = '#ff8a3d'; // burst rays
export const EXPLOSION_SHOCKWAVE_COLOR = '#ffd57a'; // expanding ring
export const EXPLOSION_DEBRIS_COLOR = '#5a4636'; // charred debris
