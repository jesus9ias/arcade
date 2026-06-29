// Physics constants. All forces are accelerations in game units/s²; consumption
// rates are units/s. Tuned for a deliberate, momentum-heavy feel.

/** Base gravitational acceleration on Earth. A level's `gravity` scales this. */
export const EARTH_GRAVITY = 120;

/** Acceleration applied by a single active thruster (propulsor or turbine). */
export const PROPULSOR_FORCE = 260;

/** Fuel consumed per second by each active propulsor. */
export const FUEL_CONSUMPTION_RATE = 60;

/** Electricity consumed per second by each active turbine. */
export const ELECTRICITY_CONSUMPTION_RATE = 50;

/** Maximum downward velocity for a safe landing (game units/s). */
export const MAX_LANDING_SPEED = 70;

/** Maximum absolute lateral velocity for a safe landing (game units/s). */
export const MAX_LANDING_LATERAL_SPEED = 40;
