import { useTranslation } from 'react-i18next';

interface Props {
  onContinue: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export default function PauseMenu({ onContinue, onRestart, onExit }: Props) {
  const { t } = useTranslation();
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={t('pause.title')}>
      <div className="panel">
        <h2 className="panel__title">{t('pause.title')}</h2>
        <div className="panel__actions">
          <button type="button" className="button button--primary" onClick={onContinue} autoFocus>
            {t('pause.continue')}
          </button>
          <button type="button" className="button" onClick={onRestart}>
            {t('pause.restart')}
          </button>
          <button type="button" className="button" onClick={onExit}>
            {t('pause.exitLevels')}
          </button>
        </div>
      </div>
    </div>
  );
}
