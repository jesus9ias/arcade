import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveMeme } from '../lib/state/useGato';

interface MemeOverlayProps {
  meme: ActiveMeme;
  onClose: () => void;
}

export function MemeOverlay({ meme, onClose }: MemeOverlayProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="meme-overlay" onClick={onClose}>
      <div
        className="meme-overlay__content"
        onClick={(event) => event.stopPropagation()}
      >
        <img className="meme-overlay__image" src={meme.src} alt="" />
        <button type="button" className="button button--primary" onClick={onClose}>
          {t('result.closeMeme')}
        </button>
      </div>
    </div>
  );
}
