// Presentation constants for the canvas renderer. Pure colors/sizes used by the
// view layer only; game rules never read these.

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
export const FLAME_COLOR = '#ffb347';
export const FLAME_CORE_COLOR = '#fff1b8';
export const SAMPLE_COLOR = '#ffd54a';
export const SAMPLE_COLLECTED_COLOR = '#5a6072';
