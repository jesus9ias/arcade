import { useTranslation } from 'react-i18next';
import { GameMode, GameStatus } from '../lib/constants';
import { Modal } from './Modal';
import { PlayerForm } from './PlayerForm';
import type { GameState } from '../lib/state/transitions';
import type { SetupSubmission } from '../lib/state/useGato';

interface EditPlayersModalProps {
  game: GameState;
  lastPlayerTwo: string;
  onSubmit: (submission: SetupSubmission) => void;
  onCancel: () => void;
}

export function EditPlayersModal({
  game,
  lastPlayerTwo,
  onSubmit,
  onCancel,
}: EditPlayersModalProps) {
  const { t } = useTranslation();
  const midGame = game.status === GameStatus.PLAYING;

  return (
    <Modal title={t('editPlayers.title')} onClose={onCancel}>
      <PlayerForm
        initial={{
          mode: game.mode,
          humanSymbol: game.humanSymbol,
          playerOne: game.playerOne,
          playerTwo: game.mode === GameMode.HVH ? game.playerTwo : lastPlayerTwo,
        }}
        submitLabel={t('editPlayers.confirm')}
        onSubmit={onSubmit}
        onCancel={onCancel}
        warning={midGame ? t('editPlayers.midGameWarning') : undefined}
      />
    </Modal>
  );
}
