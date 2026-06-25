import { useTranslation } from 'react-i18next';
import { DRAW, GameMode, GameStatus } from '../lib/constants';
import type { PlayerSymbol } from '../lib/constants';
import type { GameState } from '../lib/state/transitions';

interface StatusBarProps {
  game: GameState;
}

export function StatusBar({ game }: StatusBarProps) {
  const { t } = useTranslation();

  const nameFor = (symbol: PlayerSymbol): string =>
    symbol === game.humanSymbol ? game.playerOne : game.playerTwo;

  let message: string;
  if (game.status === GameStatus.GAME_OVER) {
    message =
      game.winner === DRAW || game.winner === null
        ? t('result.draw')
        : t('result.win', { name: nameFor(game.winner) });
  } else {
    message = t('game.turn', { name: nameFor(game.currentTurn) });
  }

  // In HVM the human keeps one symbol; in HVH both players are human, so the
  // active symbol follows whoever is to move.
  const shownSymbol: PlayerSymbol =
    game.mode === GameMode.HVH ? game.currentTurn : game.humanSymbol;

  return (
    <div className="status">
      <p className="status__message">{message}</p>
      {(game.status === GameStatus.IDLE || game.status === GameStatus.PLAYING) && (
        <p className="status__you">
          {t('game.youAre', { symbol: shownSymbol })}
        </p>
      )}
    </div>
  );
}
