// Mission-rule constants.

/**
 * Time the rover may remain unable to move before the mission fails: stranded on
 * land with no fuel, submerged on a turbine-less level with no fuel, or submerged
 * on a turbine level with no electricity.
 */
export const STUCK_TIMEOUT_MS = 4000;
