import { useTranslation } from 'react-i18next';
import { LanguageToggle } from './LanguageToggle';
import { MuteToggle } from './MuteToggle';
import type { Language } from '../lib/constants/preferences';

interface Props {
  level: number;
  isPlaying: boolean;
  isPaused: boolean;
  language: Language;
  muted: boolean;
  onTogglePause: () => void;
  onSetLanguage: (lang: Language) => void;
  onToggleMute: () => void;
  onOpenControls: () => void;
}

export function Header({
  level,
  isPlaying,
  isPaused,
  language,
  muted,
  onTogglePause,
  onSetLanguage,
  onToggleMute,
  onOpenControls,
}: Props) {
  const { t } = useTranslation();
  return (
    <header className="header">
      <div className="wordmark">{t('game.title').toUpperCase()}</div>
      <div className="header-right">
        <span className="header-level">
          {t('hud.level').toUpperCase()} <strong>{level}</strong>
        </span>
        <LanguageToggle language={language} onSetLanguage={onSetLanguage} />
        <MuteToggle muted={muted} onToggleMute={onToggleMute} />
        <button
          type="button"
          className="icon-btn"
          title={t('controls.title')}
          aria-label={t('controls.title')}
          onClick={onOpenControls}
        >
          ?
        </button>
        {(isPlaying || isPaused) && (
          <button
            type="button"
            className="icon-btn header-pause"
            title={t('controls.pause')}
            aria-label={t('controls.pause')}
            onClick={onTogglePause}
          >
            {isPaused ? '▶' : '❚❚'}
          </button>
        )}
      </div>
    </header>
  );
}
