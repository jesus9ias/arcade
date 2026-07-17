import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n/config';
import { useTetris } from '../lib/state/useTetris';
import { Header } from './Header';
import { HoldPanel } from './HoldPanel';
import { StatsPanel } from './StatsPanel';
import { NextQueue } from './NextQueue';
import { Board } from './Board';
import { TouchControls } from './TouchControls';
import { StartScreen } from './StartScreen';
import { Scoreboard } from './Scoreboard';
import { ControlsModal } from './ControlsModal';
import { GameOverOverlay, PauseOverlay, VictoryOverlay } from './Overlays';

export function App() {
  const { t } = useTranslation();
  const c = useTetris();
  const { state } = c;
  const [menuScreen, setMenuScreen] = useState<'menu' | 'scoreboard'>('menu');
  const [controlsOpen, setControlsOpen] = useState(false);

  const isIdle = state.status === 'IDLE';
  const remaining = state.levelGoal - state.creditedLines;

  const overlay =
    state.status === 'PAUSED' ? (
      <PauseOverlay onResume={c.togglePause} onExitToMenu={c.goToMenu} />
    ) : state.status === 'GAME_OVER' ? (
      <GameOverOverlay
        score={state.score}
        language={c.prefs.language}
        onRetry={c.restart}
        onMenu={c.goToMenu}
      />
    ) : state.status === 'VICTORY' ? (
      <VictoryOverlay
        score={state.score}
        language={c.prefs.language}
        onRetry={c.restart}
        onMenu={c.goToMenu}
      />
    ) : null;

  return (
    <div className="app">
      <div className="scanlines" />

      {c.storageWarning && (
        <div className="warning-banner" role="alert">
          <span>{t('warning.storageReset')}</span>
          <button type="button" className="toggle" onClick={c.dismissWarning}>
            ✕
          </button>
        </div>
      )}

      <Header
        level={state.level}
        isPlaying={state.status === 'PLAYING'}
        isPaused={state.status === 'PAUSED'}
        language={c.prefs.language}
        muted={c.prefs.muted}
        onTogglePause={c.togglePause}
        onSetLanguage={c.setLanguage}
        onToggleMute={c.toggleMute}
        onOpenControls={() => {
          setControlsOpen(true);
          c.playModalOpen();
        }}
      />

      {isIdle && menuScreen === 'scoreboard' ? (
        <Scoreboard
          scores={c.scores}
          language={c.prefs.language}
          onClear={c.clearScores}
          onBack={() => setMenuScreen('menu')}
        />
      ) : isIdle ? (
        <StartScreen
          startLevel={c.prefs.startLevel}
          onSetStartLevel={c.setStartLevel}
          onPlay={c.start}
          onOpenScoreboard={() => {
            setMenuScreen('scoreboard');
            c.playModalOpen();
          }}
          onOpenControls={() => {
            setControlsOpen(true);
            c.playModalOpen();
          }}
        />
      ) : (
        <>
          <div className="game-grid">
            <div className="grid-area-hold">
              <HoldPanel hold={state.hold} holdsRemaining={state.holdsRemaining} />
            </div>
            <div className="grid-area-stats">
              <StatsPanel
                level={state.level}
                score={state.score}
                linesCleared={state.linesCleared}
                remaining={remaining}
                language={c.prefs.language}
              />
            </div>

            <div className="grid-area-board">
              <Board board={state.board} active={state.active} ghost={c.ghost} overlay={overlay} />
            </div>

            <div className="grid-area-next">
              <NextQueue queue={state.queue} />
            </div>
          </div>

          <TouchControls controller={c} />
        </>
      )}

      {controlsOpen && <ControlsModal onClose={() => setControlsOpen(false)} />}
    </div>
  );
}
