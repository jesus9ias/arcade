import { useTranslation } from 'react-i18next';
import type { Language } from '../lib/constants/preferences';

interface Props {
  language: Language;
  onSetLanguage: (lang: Language) => void;
}

// Toggle shows the TARGET language (same convention as the other arcade games).
export function LanguageToggle({ language, onSetLanguage }: Props) {
  const { t } = useTranslation();
  const target: Language = language === 'en' ? 'es' : 'en';
  return (
    <button
      type="button"
      className="toggle"
      title={t('nav.language')}
      aria-label={t('nav.language')}
      onClick={() => onSetLanguage(target)}
    >
      {target === 'es' ? 'ES' : 'EN'}
    </button>
  );
}
