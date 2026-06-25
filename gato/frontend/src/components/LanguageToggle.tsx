import { useTranslation } from 'react-i18next';
import { Language } from '../lib/constants';
import type { Language as LanguageType } from '../lib/constants';

interface LanguageToggleProps {
  language: LanguageType;
  onChange: (language: LanguageType) => void;
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  const { t } = useTranslation();
  const target = language === Language.EN ? Language.ES : Language.EN;
  return (
    <button
      type="button"
      className="icon-button language-toggle"
      onClick={() => onChange(target)}
      aria-label={t('nav.switchLanguage')}
      title={t('nav.switchLanguage')}
    >
      {target.toUpperCase()}
    </button>
  );
}
