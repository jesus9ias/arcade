import { useTranslation } from 'react-i18next';
import { PieceGrid } from './PieceGrid';
import type { TetriminoType } from '../lib/engine/piece';

interface Props {
  queue: TetriminoType[];
}

export function NextQueue({ queue }: Props) {
  const { t } = useTranslation();
  return (
    <div className="panel panel--pink next-row">
      <div className="panel-label panel-label--pink">{t('hud.next')}</div>
      <div className="next-list">
        {queue.map((type, i) => (
          <PieceGrid key={i} type={type} className="next-piece" />
        ))}
      </div>
    </div>
  );
}
