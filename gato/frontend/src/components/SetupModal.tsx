import { useTranslation } from 'react-i18next';
import { GameMode } from '../lib/constants';
import { Modal } from './Modal';
import { PlayerForm } from './PlayerForm';
import type { GameState } from '../lib/state/transitions';
import type { SetupSubmission } from '../lib/state/useGato';

interface SetupModalProps {
  game: GameState;
  onSubmit: (submission: SetupSubmission) => void;
}

export function SetupModal({ game, onSubmit }: SetupModalProps) {
  const { t } = useTranslation();
  const title =
    game.mode === GameMode.HVH ? t('setup.titleHVH') : t('setup.titleHVM');

  return (
    <Modal title={title}>
      <PlayerForm
        initial={{
          mode: game.mode,
          humanSymbol: game.humanSymbol,
          playerOne: game.playerOne,
          playerTwo: game.mode === GameMode.HVH ? game.playerTwo : '',
        }}
        submitLabel={t('setup.confirm')}
        onSubmit={onSubmit}
      />
    </Modal>
  );
}
