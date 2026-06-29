import { useTranslation } from 'react-i18next';
import { Language } from '../lib/constants';
import type { Language as LanguageValue } from '../lib/constants';

interface Props {
  language: LanguageValue;
  onChange: (language: LanguageValue) => void;
}

export default function LanguageToggle({ language, onChange }: Props) {
  const { t } = useTranslation();
  const next = language === Language.EN ? Language.ES : Language.EN;
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={t('nav.language')}
      title={t('nav.language')}
      onClick={() => onChange(next)}
    >
      {language === Language.EN ? 'EN' : 'ES'}
    </button>
  );
}
