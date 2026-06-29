import { useTranslation } from 'react-i18next';
import { Theme } from '../lib/constants';
import type { Theme as ThemeValue } from '../lib/constants';

interface Props {
  theme: ThemeValue;
  onChange: (theme: ThemeValue) => void;
}

export default function ThemeToggle({ theme, onChange }: Props) {
  const { t } = useTranslation();
  const next = theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={t('nav.theme')}
      title={t('nav.theme')}
      onClick={() => onChange(next)}
    >
      {theme === Theme.DARK ? '☾' : '☀'}
    </button>
  );
}
