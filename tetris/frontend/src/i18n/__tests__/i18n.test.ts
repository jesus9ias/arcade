import { describe, it, expect } from 'vitest';
import { en, es } from '../config';

type Dict = Record<string, unknown>;

function leafEntries(obj: Dict, prefix = ''): Array<[string, unknown]> {
  const out: Array<[string, unknown]> = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...leafEntries(v as Dict, key));
    } else {
      out.push([key, v]);
    }
  }
  return out;
}

const keys = (obj: Dict) => leafEntries(obj).map(([k]) => k);

describe('T-I18N i18n dictionaries', () => {
  it('T-I18N-01 English and Spanish have identical key sets', () => {
    expect(new Set(keys(en as Dict))).toEqual(new Set(keys(es as Dict)));
  });

  it('T-I18N-02 no key has an empty value', () => {
    for (const dict of [en, es]) {
      for (const [, v] of leafEntries(dict as Dict)) {
        expect(typeof v).toBe('string');
        expect(String(v).length).toBeGreaterThan(0);
      }
    }
  });
});
