import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n/config';
import { GameStatus, EXPLOSION_DURATION_MS } from '../lib/constants';
import { lastLevelId } from '../lib/levels';
import { useGame } from '../lib/state/useRover';
import { usePrefs } from './usePrefs';
import GameCanvas from './GameCanvas';
import HUD from './HUD';
import LevelSelectScreen from './LevelSelectScreen';
import PauseMenu from './PauseMenu';
import MissionResult from './MissionResult';
import ControlsOverlay from './ControlsOverlay';
import TouchControls from './TouchControls';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';

export default function App() {
  const { t } = useTranslation();
  const { prefs, warning: prefsWarning, setTheme, setLanguage, dismissWarning } = usePrefs();
  const game = useGame();
  const { pause, resume } = game;
  const [showControls, setShowControls] = useState(false);
  // True while the controls overlay is what paused the mission, so closing it
  // resumes — but opening controls from the pause menu leaves the menu paused.
  const pausedByControlsRef = useRef(false);

  const status = game.state.status;
  const level = game.level;
  const inMission = status !== GameStatus.LEVEL_SELECT && level !== null;
  const showWarning = prefsWarning || game.warning !== null;

  // The end-of-mission modal. On MISSION_FAILED it is held back until the crash
  // explosion (GameCanvas) has played, so the boom reads as the loss reason;
  // ESCAPED / MISSION_ABORTED show it immediately.
  const isResult =
    status === GameStatus.MISSION_FAILED ||
    status === GameStatus.MISSION_ABORTED ||
    status === GameStatus.ESCAPED;
  const [showResult, setShowResult] = useState(false);
  useEffect(() => {
    if (!isResult) {
      setShowResult(false);
      return;
    }
    if (status === GameStatus.MISSION_FAILED) {
      const id = window.setTimeout(() => setShowResult(true), EXPLOSION_DURATION_MS);
      return () => window.clearTimeout(id);
    }
    setShowResult(true);
  }, [isResult, status]);

  // 'c' toggles the controls overlay during a mission.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'c' || e.key === 'C') && inMission) setShowControls((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inMission]);

  // Opening the controls overlay pauses an active mission; closing it resumes,
  // but only when the overlay is what paused it (see pausedByControlsRef).
  useEffect(() => {
    if (showControls) {
      if (status === GameStatus.PLAYING) {
        pausedByControlsRef.current = true;
        pause();
      }
    } else if (pausedByControlsRef.current) {
      pausedByControlsRef.current = false;
      resume();
    }
  }, [showControls, status, pause, resume]);

  const handleExit = () => {
    setShowControls(false);
    game.exit();
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">{t('game.title')}</h1>
        <div className="app__nav">
          {inMission && (
            <button
              type="button"
              className="icon-button"
              onClick={() => setShowControls(true)}
              aria-label={t('controls.title')}
              title={t('controls.title')}
            >
              ?
            </button>
          )}
          {(status === GameStatus.PLAYING || status === GameStatus.PAUSED) && (
            <button
              type="button"
              className="icon-button"
              onClick={() => (status === GameStatus.PLAYING ? game.pause() : game.resume())}
              aria-label={t('pause.title')}
              title={t('pause.title')}
            >
              {status === GameStatus.PLAYING ? '❚❚' : '▶'}
            </button>
          )}
          <LanguageToggle language={prefs.language} onChange={setLanguage} />
          <ThemeToggle theme={prefs.theme} onChange={setTheme} />
        </div>
      </header>

      {showWarning && (
        <div className="warning" role="alert">
          <span>{t('error.invalidStorage')}</span>
          <button
            type="button"
            className="warning__close"
            onClick={() => {
              dismissWarning();
              game.dismissWarning();
            }}
            aria-label={t('controls.close')}
          >
            ×
          </button>
        </div>
      )}

      <main className="app__main">
        {!inMission || level === null ? (
          <LevelSelectScreen progress={game.progress} onSelect={game.selectLevel} />
        ) : (
          <div className="stage">
            <GameCanvas state={game.state} level={level} />
            <HUD state={game.state} level={level} />
            <TouchControls
              showModeToggle={level.tools.waterTurbines}
              showLaser={level.tools.laser}
            />

            {status === GameStatus.PAUSED && !showControls && (
              <PauseMenu
                onContinue={game.resume}
                onRestart={game.restart}
                onExit={handleExit}
              />
            )}

            {isResult && showResult && (
              <MissionResult
                status={status}
                result={game.result}
                isLastLevel={level.id === lastLevelId()}
                onRestart={game.restart}
                onContinue={game.resume}
                onExit={handleExit}
              />
            )}

            {showControls && <ControlsOverlay onClose={() => setShowControls(false)} />}
          </div>
        )}
      </main>
    </div>
  );
}
