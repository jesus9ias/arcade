import { useTranslation } from 'react-i18next';
import { DRAW, GameMode, GameStatus } from '../lib/constants';
import type { PlayerSymbol } from '../lib/constants';
import type { GameState } from '../lib/state/transitions';

interface PlayersBarProps {
  game: GameState;
  onEdit: () => void;
}

interface Player {
  name: string;
  symbol: PlayerSymbol;
  editable: boolean;
}

export function PlayersBar({ game, onEdit }: PlayersBarProps) {
  const { t } = useTranslation();

  const otherSymbol: PlayerSymbol = game.humanSymbol === 'X' ? 'O' : 'X';

  // The active chip is the player to move, or — once the game is over — the
  // winner (no chip is active on a draw).
  const activeSymbol: PlayerSymbol | null =
    game.status === GameStatus.GAME_OVER
      ? game.winner === DRAW || game.winner === null
        ? null
        : game.winner
      : game.currentTurn;

  // playerOne always holds the human's chosen symbol; playerTwo the other. In
  // HVM playerTwo is the machine, which is not editable.
  const players: Player[] = [
    { name: game.playerOne, symbol: game.humanSymbol, editable: true },
    {
      name: game.playerTwo,
      symbol: otherSymbol,
      editable: game.mode === GameMode.HVH,
    },
  ];

  const renderChip = (player: Player) => {
    const isActive = player.symbol === activeSymbol;
    const className = `player-chip${isActive ? ' is-active' : ''}`;
    const inner = (
      <>
        <span className="player-chip__symbol" aria-hidden="true">
          {player.symbol}
        </span>
        <span className="player-chip__name">{player.name}</span>
      </>
    );

    if (!player.editable) {
      return (
        <div
          key={player.symbol}
          className={`${className} player-chip--static`}
          aria-current={isActive ? true : undefined}
        >
          {inner}
        </div>
      );
    }

    return (
      <button
        key={player.symbol}
        type="button"
        className={className}
        onClick={onEdit}
        aria-current={isActive ? true : undefined}
        title={t('game.editPlayers')}
      >
        {inner}
      </button>
    );
  };

  return (
    <div className="players-bar">
      {renderChip(players[0])}
      <span className="players-bar__vs">{t('game.vs')}</span>
      {renderChip(players[1])}
    </div>
  );
}
