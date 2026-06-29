import { describe, it, expect } from 'vitest';
import {
  applyGravity,
  applyPropulsor,
  applyTurbine,
  integratePosition,
} from '../physics';
import {
  EARTH_GRAVITY,
  PROPULSOR_FORCE,
  FUEL_CONSUMPTION_RATE,
  ELECTRICITY_CONSUMPTION_RATE,
  PropulsorMode,
} from '../../constants';
import type { RoverState } from '../../constants';

// Stage 2 failing tests — physics (T-PHY-*). Implementation arrives in Stage 3.

const makeRover = (over: Partial<RoverState> = {}): RoverState => ({
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  fuel: 1000,
  electricity: 1000,
  mode: PropulsorMode.PROPULSOR,
  grounded: false,
  underwater: false,
  destroyed: false,
  ...over,
});

describe('physics — gravity', () => {
  it('T-PHY-01: gravity increases vy by gravity × EARTH_GRAVITY × dt', () => {
    const next = applyGravity(makeRover(), 1, 0.5);
    expect(next.velocity.y).toBeCloseTo(0.5 * EARTH_GRAVITY * 1);
  });

  it('T-PHY-08: gravity is cancelled while grounded', () => {
    const next = applyGravity(makeRover({ grounded: true }), 1, 1);
    expect(next.velocity.y).toBe(0);
  });
});

describe('physics — propulsors', () => {
  it('T-PHY-02: bottom propulsor decreases vy and consumes fuel', () => {
    const next = applyPropulsor(makeRover(), 'BOTTOM', 1);
    expect(next.velocity.y).toBeCloseTo(-PROPULSOR_FORCE * 1);
    expect(next.fuel).toBeCloseTo(1000 - FUEL_CONSUMPTION_RATE);
  });

  it('T-PHY-03: left propulsor increases vx and consumes fuel', () => {
    const next = applyPropulsor(makeRover(), 'LEFT', 1);
    expect(next.velocity.x).toBeCloseTo(PROPULSOR_FORCE * 1);
    expect(next.fuel).toBeCloseTo(1000 - FUEL_CONSUMPTION_RATE);
  });

  it('T-PHY-04: right propulsor decreases vx and consumes fuel', () => {
    const next = applyPropulsor(makeRover(), 'RIGHT', 1);
    expect(next.velocity.x).toBeCloseTo(-PROPULSOR_FORCE * 1);
    expect(next.fuel).toBeCloseTo(1000 - FUEL_CONSUMPTION_RATE);
  });

  it('T-PHY-06: propulsor does not fire at 0 fuel', () => {
    const next = applyPropulsor(makeRover({ fuel: 0 }), 'BOTTOM', 1);
    expect(next.velocity.y).toBe(0);
    expect(next.fuel).toBe(0);
  });

  it('T-PHY-07: propulsor consumes FUEL_CONSUMPTION_RATE × dt', () => {
    const next = applyPropulsor(makeRover({ fuel: 100 }), 'BOTTOM', 1);
    expect(next.fuel).toBeCloseTo(100 - FUEL_CONSUMPTION_RATE);
  });

  it('T-PHY-11: propulsor underwater wastes fuel with no thrust', () => {
    const next = applyPropulsor(makeRover({ underwater: true }), 'BOTTOM', 1);
    expect(next.velocity.y).toBe(0);
    expect(next.fuel).toBeCloseTo(1000 - FUEL_CONSUMPTION_RATE);
  });
});

describe('physics — turbines', () => {
  it('T-PHY-09: turbine applies the same direction forces as the propulsor', () => {
    const next = applyTurbine(
      makeRover({ underwater: true, mode: PropulsorMode.TURBINE }),
      'BOTTOM',
      1,
    );
    expect(next.velocity.y).toBeCloseTo(-PROPULSOR_FORCE * 1);
    expect(next.electricity).toBeCloseTo(1000 - ELECTRICITY_CONSUMPTION_RATE);
  });

  it('T-PHY-10: turbine does not fire at 0 electricity', () => {
    const next = applyTurbine(
      makeRover({ underwater: true, mode: PropulsorMode.TURBINE, electricity: 0 }),
      'BOTTOM',
      1,
    );
    expect(next.velocity.y).toBe(0);
    expect(next.electricity).toBe(0);
  });

  it('T-PHY-12: turbine in atmosphere wastes electricity with no thrust', () => {
    const next = applyTurbine(
      makeRover({ underwater: false, mode: PropulsorMode.TURBINE }),
      'BOTTOM',
      1,
    );
    expect(next.velocity.y).toBe(0);
    expect(next.electricity).toBeCloseTo(1000 - ELECTRICITY_CONSUMPTION_RATE);
  });
});

describe('physics — integration', () => {
  it('T-PHY-05: position integrates from velocity', () => {
    const next = integratePosition(makeRover({ velocity: { x: 3, y: -4 } }), 2);
    expect(next.position.x).toBeCloseTo(3 * 2);
    expect(next.position.y).toBeCloseTo(-4 * 2);
  });
});
