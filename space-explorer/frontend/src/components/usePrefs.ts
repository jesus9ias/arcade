// Preferences controller: loads/validates space_prefs, applies the theme to the
// document and the language to i18next, and persists changes. Invalid stored data
// resets to defaults and raises a visible warning.

import { useCallback, useEffect, useState } from 'react';
import {
  Theme,
  Language,
  DEFAULT_PREFS,
  STORAGE_KEYS,
} from '../lib/constants';
import type { Prefs, Theme as ThemeValue, Language as LanguageValue } from '../lib/constants';
import { validatePrefs } from '../lib/validation/localStorage';
import i18n from '../i18n/config';

interface LoadResult {
  prefs: Prefs;
  warning: boolean;
}

function detectSystemPrefs(): Prefs {
  const prefersDark =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
  const browserLang =
    typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es')
      ? Language.ES
      : Language.EN;
  return {
    theme: prefersDark ? Theme.DARK : Theme.LIGHT,
    language: browserLang,
  };
}

function loadPrefs(): LoadResult {
  if (typeof localStorage === 'undefined') return { prefs: DEFAULT_PREFS, warning: false };
  const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
  if (raw === null) return { prefs: detectSystemPrefs(), warning: false };
  const result = validatePrefs(raw);
  if (!result.ok) return { prefs: detectSystemPrefs(), warning: true };
  return { prefs: result.value, warning: false };
}

function persist(prefs: Prefs): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(prefs));
}

export interface UsePrefs {
  prefs: Prefs;
  warning: boolean;
  setTheme: (theme: ThemeValue) => void;
  setLanguage: (language: LanguageValue) => void;
  dismissWarning: () => void;
}

export function usePrefs(): UsePrefs {
  const initial = loadPrefs();
  const [prefs, setPrefs] = useState<Prefs>(initial.prefs);
  const [warning, setWarning] = useState<boolean>(initial.warning);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme);
  }, [prefs.theme]);

  useEffect(() => {
    void i18n.changeLanguage(prefs.language);
  }, [prefs.language]);

  const setTheme = useCallback((theme: ThemeValue) => {
    setPrefs((current) => {
      const next = { ...current, theme };
      persist(next);
      return next;
    });
  }, []);

  const setLanguage = useCallback((language: LanguageValue) => {
    setPrefs((current) => {
      const next = { ...current, language };
      persist(next);
      return next;
    });
  }, []);

  const dismissWarning = useCallback(() => setWarning(false), []);

  return { prefs, warning, setTheme, setLanguage, dismissWarning };
}
