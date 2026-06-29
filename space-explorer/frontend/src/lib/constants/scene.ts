// Scene geometry. The scene has a fixed height; width is the level's heightmap
// length. Convention: 1 heightmap column = 1 game unit horizontally.

/** Fixed scene height in game units (no vertical scrolling). */
export const SCENE_HEIGHT = 600;

/** Width in game units of a single heightmap column. */
export const COLUMN_WIDTH = 1;

/** Rover spawn height (top-left y, from the top of the scene) at mission start. */
export const ROVER_SPAWN_Y = 20;
