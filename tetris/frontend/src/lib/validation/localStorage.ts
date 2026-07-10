// localStorage validation. Inputs are the raw stored strings; parsing and
// schema checks happen here so callers can reset to defaults on failure.

import { MAX_LEVEL, MIN_LEVEL } from '../constants/levels';
import type { Prefs } from '../constants/preferences';
import type { GameRecord, Scores } from '../history/records';
import { err, ok } from './result';
import type { Result } from './result';

function parseJson(raw: string | null): Result<unknown> {
  if (raw === null) return err('missing');
  try {
    return ok(JSON.parse(raw));
  } catch {
    return err('invalid json');
  }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function validatePrefs(raw: string | null): Result<Prefs> {
  const parsed = parseJson(raw);
  if (!parsed.ok) return parsed;
  const o = parsed.value;
  if (!isObject(o)) return err('not an object');

  if (o.language !== 'en' && o.language !== 'es') return err('invalid language');
  if (typeof o.muted !== 'boolean') return err('invalid muted');
  if (typeof o.startLevel !== 'number' || !Number.isFinite(o.startLevel)) {
    return err('invalid startLevel');
  }

  const startLevel = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(o.startLevel)));
  return ok({ language: o.language, muted: o.muted, startLevel });
}

function isValidRecord(v: unknown): v is GameRecord {
  if (!isObject(v)) return false;
  const numberFields = [
    'startLevel',
    'endLevel',
    'linesCleared',
    'score',
    'regularPoints',
    'bonusPoints',
    'durationMs',
  ];
  return (
    typeof v.id === 'string' &&
    typeof v.date === 'string' &&
    numberFields.every((f) => typeof v[f] === 'number' && Number.isFinite(v[f] as number)) &&
    (v.outcome === 'GAME_OVER' || v.outcome === 'VICTORY')
  );
}

export function validateScores(raw: string | null): Result<Scores> {
  const parsed = parseJson(raw);
  if (!parsed.ok) return parsed;
  const o = parsed.value;
  if (!isObject(o)) return err('not an object');
  if (!Array.isArray(o.records)) return err('records must be an array');

  const records = o.records.filter(isValidRecord);
  const best = isValidRecord(o.best) ? o.best : null;
  return ok({ records, best });
}
