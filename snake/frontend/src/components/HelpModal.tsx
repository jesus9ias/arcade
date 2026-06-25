import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';

interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  const { t } = useTranslation();
  return (
    <Modal title={t('help.title')} onClose={onClose}>
      <p className="help__goal">{t('help.goal')}</p>
      <ul className="help__list">
        <li>{t('help.turnCw')}</li>
        <li>{t('help.turnCcw')}</li>
        <li>{t('help.pause')}</li>
        <li>{t('help.boost')}</li>
        <li>{t('help.versus')}</li>
      </ul>
      <button type="button" className="button button--primary" onClick={onClose}>
        {t('help.close')}
      </button>
    </Modal>
  );
}
