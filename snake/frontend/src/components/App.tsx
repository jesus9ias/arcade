import { useTranslation } from 'react-i18next';
import '../i18n/config';
import { GameMode, GameStatus } from '../lib/constants';
import { useSnake } from '../lib/state/useSnake';
import { GameCanvas } from './GameCanvas';
import { Hud } from './Hud';
import { Controls } from './Controls';
import { ModeSelector } from './ModeSelector';
import { HelpModal } from './HelpModal';
import { HistoryModal } from './HistoryModal';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';

export default function App() {
  const { t } = useTranslation();
  const controller = useSnake();
  const { game } = controller;

  const modeLocked =
    game.status === GameStatus.PLAYING || game.status === GameStatus.PAUSED;

  const versusOutcome = (): string => {
    const { player, machine } = game.scores;
    if (player > machine) return t('result.youWon');
    if (machine > player) return t('result.machineWon');
    return t('result.tie');
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">{t('game.title')}</h1>
        <div className="app__controls">
          <button
            type="button"
            className="icon-button"
            onClick={controller.openHelp}
            aria-label={t('help.open')}
            title={t('help.open')}
          >
            ?
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={controller.openHistory}
            aria-label={t('history.title')}
            title={t('history.title')}
          >
            ☰
          </button>
          <LanguageToggle
            language={controller.prefs.language}
            onChange={controller.setLanguage}
          />
          <ThemeToggle theme={controller.prefs.theme} onToggle={controller.toggleTheme} />
        </div>
      </header>

      {controller.storageWarning && (
        <div className="banner" role="alert">
          <span>{t('error.invalidStorage')}</span>
          <button
            type="button"
            className="icon-button"
            onClick={controller.dismissStorageWarning}
            aria-label={t('help.close')}
          >
            ×
          </button>
        </div>
      )}

      <ModeSelector
        mode={game.mode}
        disabled={modeLocked}
        onChange={controller.setMode}
      />

      <Hud game={game} />

      <div className="board">
        <GameCanvas game={game} theme={controller.prefs.theme} onTurn={controller.turn} />

        {game.status === GameStatus.IDLE && (
          <div className="board__overlay">
            <p className="board__overlay-text">{t('game.start')}</p>
          </div>
        )}
        {game.status === GameStatus.PAUSED && (
          <div className="board__overlay">
            <p className="board__overlay-text">{t('game.paused')}</p>
          </div>
        )}
        {game.status === GameStatus.GAME_OVER && (
          <div className="board__overlay">
            <p className="board__overlay-title">{t('game.gameOver')}</p>
            <p className="board__overlay-text">
              {t('result.scoreLine', { score: game.scores.player })}
            </p>
            <p className="board__overlay-text">
              {t('result.levelLine', { level: game.level })}
            </p>
            {game.mode === GameMode.VERSUS && (
              <>
                <p className="board__overlay-text">
                  {t('players.machine')}: {game.scores.machine}
                </p>
                <p className="board__overlay-result">{versusOutcome()}</p>
              </>
            )}
          </div>
        )}
      </div>

      <Controls
        status={game.status}
        boosted={game.boosted}
        onStart={controller.start}
        onNewGame={controller.newGame}
        onTogglePause={controller.togglePause}
        onToggleBoost={controller.toggleBoost}
      />

      {controller.helpOpen && <HelpModal onClose={controller.closeHelp} />}
      {controller.historyOpen && (
        <HistoryModal
          records={controller.history}
          onClose={controller.closeHistory}
          onClear={controller.clearHistory}
        />
      )}
    </div>
  );
}
