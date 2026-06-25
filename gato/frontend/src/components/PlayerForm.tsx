import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameMode, PLAYER_NAME_MAX_LENGTH, SYMBOLS } from '../lib/constants';
import type { GameMode as GameModeType, PlayerSymbol } from '../lib/constants';
import { validatePlayerName } from '../lib/validation/playerName';
import type { SetupSubmission } from '../lib/state/useGato';

interface PlayerFormProps {
  initial: {
    mode: GameModeType;
    humanSymbol: PlayerSymbol;
    playerOne: string;
    playerTwo: string;
  };
  submitLabel: string;
  onSubmit: (submission: SetupSubmission) => void;
  onCancel?: () => void;
  warning?: string;
}

export function PlayerForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  warning,
}: PlayerFormProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<GameModeType>(initial.mode);
  const [playerOne, setPlayerOne] = useState(initial.playerOne);
  const [playerTwo, setPlayerTwo] = useState(initial.playerTwo);
  const [humanSymbol, setHumanSymbol] = useState<PlayerSymbol>(
    initial.humanSymbol,
  );

  const isHVH = mode === GameMode.HVH;
  const oneValid = validatePlayerName(playerOne).ok;
  const twoValid = isHVH ? validatePlayerName(playerTwo).ok : true;
  const canSubmit = oneValid && twoValid;

  const changeMode = (next: GameModeType) => {
    setMode(next);
    setPlayerOne('');
    setPlayerTwo('');
  };

  const submit = () => {
    if (!canSubmit) return;
    const one = validatePlayerName(playerOne);
    const two = validatePlayerName(playerTwo);
    onSubmit({
      mode,
      humanSymbol,
      playerOne: one.ok ? one.value : playerOne,
      playerTwo: isHVH && two.ok ? two.value : playerTwo,
    });
  };

  return (
    <form
      className="player-form"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <fieldset className="player-form__group">
        <legend>{t('setup.mode')}</legend>
        <label className="player-form__radio">
          <input
            type="radio"
            name="mode"
            checked={mode === GameMode.HVM}
            onChange={() => changeMode(GameMode.HVM)}
          />
          {t('setup.modeHVM')}
        </label>
        <label className="player-form__radio">
          <input
            type="radio"
            name="mode"
            checked={isHVH}
            onChange={() => changeMode(GameMode.HVH)}
          />
          {t('setup.modeHVH')}
        </label>
      </fieldset>

      <label className="player-form__field">
        <span>{isHVH ? t('setup.playerOneName') : t('setup.playerName')}</span>
        <input
          type="text"
          value={playerOne}
          maxLength={PLAYER_NAME_MAX_LENGTH}
          onChange={(event) => setPlayerOne(event.target.value)}
        />
      </label>

      {isHVH && (
        <label className="player-form__field">
          <span>{t('setup.playerTwoName')}</span>
          <input
            type="text"
            value={playerTwo}
            maxLength={PLAYER_NAME_MAX_LENGTH}
            onChange={(event) => setPlayerTwo(event.target.value)}
          />
        </label>
      )}

      <fieldset className="player-form__group">
        <legend>{t('setup.chooseSymbol')}</legend>
        {SYMBOLS.map((symbol) => (
          <label key={symbol} className="player-form__radio">
            <input
              type="radio"
              name="symbol"
              checked={humanSymbol === symbol}
              onChange={() => setHumanSymbol(symbol)}
            />
            {symbol}
          </label>
        ))}
      </fieldset>

      {warning && <p className="player-form__warning">{warning}</p>}

      <div className="player-form__actions">
        {onCancel && (
          <button type="button" className="button" onClick={onCancel}>
            {t('editPlayers.cancel')}
          </button>
        )}
        <button type="submit" className="button button--primary" disabled={!canSubmit}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
