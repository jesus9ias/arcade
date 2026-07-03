import { describe, it, expect } from 'vitest';
import { LEVELS } from '../index';
import { WORLD_TYPE_ICON } from '../../constants';
import { en, es } from '../../../i18n/config';

// Levels data contract (T-LVL-*). Guards the permanent per-planet fields the info
// modal depends on: every level must carry a designation, a valid world type, a
// positive mass, and three non-empty lore paragraphs in both languages.

const slug = (name: string) => name.toLowerCase();
const loreKeys = (name: string) =>
  (['p1', 'p2', 'p3'] as const).map((p) => `planet.info.${slug(name)}.${p}`);

describe('levels data contract', () => {
  it('T-LVL-01: every level has a non-empty designation', () => {
    for (const level of LEVELS) {
      expect(typeof level.designation).toBe('string');
      expect(level.designation.length).toBeGreaterThan(0);
    }
  });

  it('T-LVL-02: every level has a valid worldType', () => {
    for (const level of LEVELS) {
      expect(WORLD_TYPE_ICON).toHaveProperty(level.worldType);
    }
  });

  it('T-LVL-03: every level has a positive finite massEarths', () => {
    for (const level of LEVELS) {
      expect(Number.isFinite(level.massEarths)).toBe(true);
      expect(level.massEarths).toBeGreaterThan(0);
    }
  });

  it('T-LVL-04: every level has three non-empty English lore paragraphs', () => {
    for (const level of LEVELS) {
      for (const key of loreKeys(level.name)) {
        expect(typeof en[key]).toBe('string');
        expect(en[key]).not.toBe('');
      }
    }
  });

  it('T-LVL-05: every level has three non-empty Spanish lore paragraphs', () => {
    for (const level of LEVELS) {
      for (const key of loreKeys(level.name)) {
        expect(typeof es[key]).toBe('string');
        expect(es[key]).not.toBe('');
      }
    }
  });
});
