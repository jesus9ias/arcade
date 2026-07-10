import { useTranslation } from 'react-i18next';
import { PieceGrid } from './PieceGrid';
import type { TetriminoType } from '../lib/engine/piece';

interface Props {
  hold: TetriminoType | null;
  holdsRemaining: number;
}

export function HoldPanel({ hold, holdsRemaining }: Props) {
  const { t } = useTranslation();
  return (
    <div className="panel panel--cyan">
      <div className="panel-label panel-label--cyan">{t('hud.hold')}</div>
      <PieceGrid type={hold} className="hold-grid" cellShadowBlur={8} />
      <div className="to-hold">
        {t('hud.toHold')}: <strong>{holdsRemaining}</strong>
      </div>
    </div>
  );
}
