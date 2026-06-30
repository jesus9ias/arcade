// Laser tool constants. The laser carves a flat pit straight down under the
// rover, exposing buried subsurface samples. All values are in game units.

/** Width of the carved beam, in columns. Wider than ROVER_WIDTH so the rover fits in the pit. */
export const LASER_WIDTH = 40;

/** Depth the beam lowers each column it covers. */
export const LASER_DEPTH = 60;

/** Fuel spent per laser shot. The laser only fires while grounded with at least this much fuel. */
export const LASER_FUEL_COST = 120;
