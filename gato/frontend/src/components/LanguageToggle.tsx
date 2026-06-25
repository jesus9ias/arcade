import { useTranslation } from 'react-i18next';
import { Language } from '../lib/constants';
import type { Language as LanguageType } from '../lib/constants';

interface LanguageToggleProps {
  language: LanguageType;
  onChange: (language: LanguageType) => void;
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  const { t } = useTranslation();
  return (
    <label className="language-toggle">
      <span className="visually-hidden">{t('nav.language')}</span>
      <select
        value={language}
        onChange={(event) => onChange(event.target.value as LanguageType)}
        aria-label={t('nav.language')}
      >
        <option value={Language.EN}>EN</option>
        <option value={Language.ES}>ES</option>
      </select>
    </label>
  );
}
