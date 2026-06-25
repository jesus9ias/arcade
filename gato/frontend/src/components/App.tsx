import { useTranslation } from 'react-i18next';
import '../i18n/config';
import { GameMode, GameStatus } from '../lib/constants';
import { useGato } from '../lib/state/useGato';
import { Board } from './Board';
import { EditPlayersModal } from './EditPlayersModal';
import { HistoryModal } from './HistoryModal';
import { LanguageToggle } from './LanguageToggle';
import { MemeOverlay } from './MemeOverlay';
import { SetupModal } from './SetupModal';
import { StatusBar } from './StatusBar';
import { ThemeToggle } from './ThemeToggle';

export default function App() {
  const { t } = useTranslation();
  const controller = useGato();
  const { game } = controller;

  const boardDisabled =
    game.status === GameStatus.SETUP ||
    game.status === GameStatus.GAME_OVER ||
    (game.mode === GameMode.HVM && game.currentTurn !== game.humanSymbol);

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">{t('game.title')}</h1>
        <div className="app__controls">
          <LanguageToggle
            language={controller.prefs.language}
            onChange={controller.setLanguage}
          />
          <ThemeToggle
            theme={controller.prefs.theme}
            onToggle={controller.toggleTheme}
          />
        </div>
      </header>

      {controller.storageWarning && (
        <div className="banner" role="alert">
          <span>{t('error.invalidStorage')}</span>
          <button
            type="button"
            className="icon-button"
            onClick={controller.dismissStorageWarning}
            aria-label={t('result.closeMeme')}
          >
            ×
          </button>
        </div>
      )}

      <StatusBar game={game} />

      <Board
        board={game.board}
        winningLine={game.winningLine}
        disabled={boardDisabled}
        onPlay={controller.playCell}
      />

      {controller.memeError && (
        <p className="banner banner--soft" role="status">
          {t('error.noMemes')}
        </p>
      )}

      <div className="app__actions">
        <button type="button" className="button" onClick={controller.startNew}>
          {t('game.restart')}
        </button>
        <button type="button" className="button" onClick={controller.openEdit}>
          {t('game.editPlayers')}
        </button>
        <button type="button" className="button" onClick={controller.openHistory}>
          {t('game.history')}
        </button>
      </div>

      {game.status === GameStatus.SETUP && (
        <SetupModal game={game} onSubmit={controller.submitSetup} />
      )}
      {controller.editOpen && (
        <EditPlayersModal
          game={game}
          onSubmit={controller.submitSetup}
          onCancel={controller.closeEdit}
        />
      )}
      {controller.historyOpen && (
        <HistoryModal
          records={controller.history}
          onClose={controller.closeHistory}
          onClear={controller.clearHistory}
        />
      )}
      {controller.meme && (
        <MemeOverlay meme={controller.meme} onClose={controller.closeMeme} />
      )}
    </div>
  );
}
