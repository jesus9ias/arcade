import { useTranslation } from 'react-i18next';
import { Theme } from '../lib/constants';
import type { Theme as ThemeType } from '../lib/constants';

interface ThemeToggleProps {
  theme: ThemeType;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="icon-button"
      onClick={onToggle}
      aria-label={t('nav.theme')}
      title={t('nav.theme')}
    >
      {theme === Theme.DARK ? '🌙' : '☀️'}
    </button>
  );
}
