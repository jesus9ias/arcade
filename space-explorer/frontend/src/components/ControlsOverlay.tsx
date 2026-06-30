import { useTranslation } from 'react-i18next';

interface Props {
  onClose: () => void;
}

export default function ControlsOverlay({ onClose }: Props) {
  const { t } = useTranslation();
  const lines = [
    'controls.left',
    'controls.right',
    'controls.up',
    'controls.mode',
    'controls.laser',
    'controls.controls',
    'controls.pause',
  ] as const;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={t('controls.title')}>
      <div className="panel">
        <h2 className="panel__title">{t('controls.title')}</h2>
        <ul className="controls-list">
          {lines.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
        <div className="panel__actions">
          <button type="button" className="button button--primary" onClick={onClose} autoFocus>
            {t('controls.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
