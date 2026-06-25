import { useTranslation } from 'react-i18next';
import { Language } from '../lib/constants';
import type { Language as LanguageValue } from '../lib/constants';

interface LanguageToggleProps {
  language: LanguageValue;
  onChange: (language: LanguageValue) => void;
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  const { t } = useTranslation();
  const target = language === Language.EN ? Language.ES : Language.EN;
  return (
    <button
      type="button"
      className="icon-button language-toggle"
      onClick={() => onChange(target)}
      aria-label={t('nav.language')}
      title={t('nav.language')}
    >
      {target.toUpperCase()}
    </button>
  );
}
