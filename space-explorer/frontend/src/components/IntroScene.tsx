// Scene manager for the story intro. Picks the active scene from the
// configurable timeline (INTRO_SCENES) based on the current paragraph and
// cross-fades between scenes when it changes. Presentation only.

import { useEffect, useState } from 'react';
import { INTRO_SCENES, INTRO_SCENE_FADE_MS } from '../lib/constants';
import type { IntroSceneKey } from '../lib/constants';
import { SpaceScene, CityScene, DepartureScene, ApproachScene } from './IntroScenes';

interface Props {
  /** Whether the story has started (before this, the opening scene shows). */
  started: boolean;
  /** Current 0-based paragraph index. */
  index: number;
}

/** The active scene: the last timeline entry whose startParagraph ≤ index; the
 *  opening scene (startParagraph −1) wins on the start screen. */
function activeSceneKey(started: boolean, index: number): IntroSceneKey {
  const paragraph = started ? index : -1;
  let key: IntroSceneKey = INTRO_SCENES[0].key;
  for (const scene of INTRO_SCENES) {
    if (scene.startParagraph <= paragraph) key = scene.key;
  }
  return key;
}

function renderScene(key: IntroSceneKey) {
  switch (key) {
    case 'city':
      return <CityScene />;
    case 'departure':
      return <DepartureScene />;
    case 'approach':
      return <ApproachScene />;
    case 'space':
    default:
      return <SpaceScene />;
  }
}

export default function IntroScene({ started, index }: Props) {
  const key = activeSceneKey(started, index);
  const [current, setCurrent] = useState<IntroSceneKey>(key);
  const [previous, setPrevious] = useState<IntroSceneKey | null>(null);

  // On a scene change, keep the outgoing scene mounted briefly so the two
  // cross-fade instead of cutting.
  useEffect(() => {
    if (key === current) return;
    setPrevious(current);
    setCurrent(key);
    const id = window.setTimeout(() => setPrevious(null), INTRO_SCENE_FADE_MS);
    return () => window.clearTimeout(id);
  }, [key, current]);

  return (
    <div className="intro-scene" aria-hidden="true">
      {previous && (
        <div key={`${previous}-out`} className="intro-scene__layer intro-scene__layer--out">
          {renderScene(previous)}
        </div>
      )}
      <div key={`${current}-in`} className="intro-scene__layer intro-scene__layer--in">
        {renderScene(current)}
      </div>
    </div>
  );
}
