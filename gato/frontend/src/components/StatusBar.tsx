import { useTranslation } from 'react-i18next';
import { DRAW, GameStatus } from '../lib/constants';
import type { PlayerSymbol } from '../lib/constants';
import type { GameState } from '../lib/state/transitions';

interface StatusBarProps {
  game: GameState;
}

export function StatusBar({ game }: StatusBarProps) {
  const { t } = useTranslation();

  // The turn is conveyed by the players bar; the status bar only announces the
  // outcome once the game is over.
  if (game.status !== GameStatus.GAME_OVER) {
    return null;
  }

  const nameFor = (symbol: PlayerSymbol): string =>
    symbol === game.humanSymbol ? game.playerOne : game.playerTwo;

  const message =
    game.winner === DRAW || game.winner === null
      ? t('result.draw')
      : t('result.win', { name: nameFor(game.winner) });

  return (
    <div className="status" role="status">
      <p className="status__message">{message}</p>
    </div>
  );
}
