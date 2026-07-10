import { useTranslation } from 'react-i18next';

interface Props {
  muted: boolean;
  onToggleMute: () => void;
}

export function MuteToggle({ muted, onToggleMute }: Props) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="toggle"
      title={muted ? t('nav.unmute') : t('nav.mute')}
      aria-label={muted ? t('nav.unmute') : t('nav.mute')}
      onClick={onToggleMute}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
