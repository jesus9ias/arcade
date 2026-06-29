import { describe, it, expect } from 'vitest';
import { en, es } from '../config';

// Stage 2 failing tests — i18n (T-I18N-*). The i18n config and populated
// translation maps arrive in Stage 3.

describe('i18n', () => {
  it('T-I18N-01: English and Spanish have identical key sets', () => {
    const enKeys = Object.keys(en).sort();
    const esKeys = Object.keys(es).sort();
    expect(enKeys.length).toBeGreaterThan(0);
    expect(enKeys).toEqual(esKeys);
  });

  it('T-I18N-02: no key has an empty string value', () => {
    for (const key of Object.keys(en)) {
      expect(typeof en[key]).toBe('string');
      expect(en[key]).not.toBe('');
      expect(es[key]).not.toBe('');
    }
  });
});
