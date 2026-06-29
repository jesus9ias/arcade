// Pure rover physics. Every function returns a new RoverState; no DOM, no
// timers, no randomness. dt is the elapsed time in seconds for the step.

import {
  EARTH_GRAVITY,
  PROPULSOR_FORCE,
  FUEL_CONSUMPTION_RATE,
  ELECTRICITY_CONSUMPTION_RATE,
  ThrusterDirection,
} from '../constants';
import type { RoverState, ThrusterDirection as ThrusterDir, Vector2 } from '../constants';

/** Applies a thruster's acceleration to a velocity, by direction. */
function thrust(velocity: Vector2, direction: ThrusterDir, dt: number): Vector2 {
  const delta = PROPULSOR_FORCE * dt;
  switch (direction) {
    case ThrusterDirection.BOTTOM:
      return { x: velocity.x, y: velocity.y - delta };
    case ThrusterDirection.LEFT:
      return { x: velocity.x + delta, y: velocity.y };
    case ThrusterDirection.RIGHT:
      return { x: velocity.x - delta, y: velocity.y };
    default:
      return velocity;
  }
}

/**
 * Increases downward velocity by `gravity × EARTH_GRAVITY × dt`. While grounded,
 * gravity is cancelled and vy is held at 0.
 */
export function applyGravity(rover: RoverState, dt: number, gravity: number): RoverState {
  if (rover.grounded) {
    return { ...rover, velocity: { ...rover.velocity, y: 0 } };
  }
  return {
    ...rover,
    velocity: { ...rover.velocity, y: rover.velocity.y + gravity * EARTH_GRAVITY * dt },
  };
}

/**
 * Fires a propulsor: consumes fuel and applies thrust. Propulsors only thrust in
 * the atmosphere — underwater they still burn fuel but produce no force. At 0
 * fuel nothing happens.
 */
export function applyPropulsor(
  rover: RoverState,
  direction: ThrusterDir,
  dt: number,
): RoverState {
  if (rover.fuel <= 0) return rover;
  const fuel = Math.max(0, rover.fuel - FUEL_CONSUMPTION_RATE * dt);
  const velocity = rover.underwater ? rover.velocity : thrust(rover.velocity, direction, dt);
  return { ...rover, fuel, velocity };
}

/**
 * Fires a turbine: consumes electricity and applies thrust. Turbines only thrust
 * underwater — in atmosphere they still drain electricity but produce no force.
 * At 0 electricity nothing happens.
 */
export function applyTurbine(
  rover: RoverState,
  direction: ThrusterDir,
  dt: number,
): RoverState {
  if (rover.electricity <= 0) return rover;
  const electricity = Math.max(0, rover.electricity - ELECTRICITY_CONSUMPTION_RATE * dt);
  const velocity = rover.underwater ? thrust(rover.velocity, direction, dt) : rover.velocity;
  return { ...rover, electricity, velocity };
}

/** Integrates position from velocity over dt. */
export function integratePosition(rover: RoverState, dt: number): RoverState {
  return {
    ...rover,
    position: {
      x: rover.position.x + rover.velocity.x * dt,
      y: rover.position.y + rover.velocity.y * dt,
    },
  };
}
