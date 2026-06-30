// On-screen thrusters for touch devices. They mirror the keyboard layout by
// dispatching the same Arrow key events the controller already listens for, so no
// game logic is duplicated here. On turbine-capable levels an extra button taps
// the `m` mode toggle; on laser levels another taps the `x` laser.

import { useRef, type ReactNode } from 'react';

interface ThrusterButtonProps {
  keyName: 'ArrowLeft' | 'ArrowDown' | 'ArrowRight';
  glyph: string;
  label: string;
}

function press(keyName: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: keyName }));
}

function release(keyName: string): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { key: keyName }));
}

function ThrusterButton({ keyName, glyph, label }: ThrusterButtonProps) {
  return (
    <button
      type="button"
      className="touch-button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        press(keyName);
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        release(keyName);
      }}
      onPointerLeave={() => release(keyName)}
      onPointerCancel={() => release(keyName)}
      // iOS/Safari fires touchstart reliably; mirror the keydown there too.
      onTouchStart={(e) => {
        e.preventDefault();
        press(keyName);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        release(keyName);
      }}
    >
      {glyph}
    </button>
  );
}

interface TapButtonProps {
  keyName: string;
  glyph: ReactNode;
  label: string;
}

/** A single-shot button (mode / laser): dispatches one keydown per press.
 *  pointerdown and touchstart can both fire for one tap, so it debounces. */
function TapButton({ keyName, glyph, label }: TapButtonProps) {
  const lastRef = useRef(0);
  const tap = () => {
    const now = Date.now();
    if (now - lastRef.current < 300) return;
    lastRef.current = now;
    window.dispatchEvent(new KeyboardEvent('keydown', { key: keyName }));
  };
  return (
    <button
      type="button"
      className="touch-button touch-button--action"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        tap();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        tap();
      }}
    >
      {glyph}
    </button>
  );
}

interface TouchControlsProps {
  /** Show the propulsor/turbine mode toggle (turbine-capable levels only). */
  showModeToggle?: boolean;
  /** Show the laser button (laser-equipped levels only). */
  showLaser?: boolean;
}

export default function TouchControls({
  showModeToggle = false,
  showLaser = false,
}: TouchControlsProps) {
  return (
    <div className="touch-controls" aria-hidden={false}>
      <ThrusterButton keyName="ArrowLeft" glyph="◀" label="Left thruster" />
      <ThrusterButton keyName="ArrowDown" glyph="▼" label="Main thruster" />
      <ThrusterButton keyName="ArrowRight" glyph="▶" label="Right thruster" />
      {showModeToggle && (
        <TapButton keyName="m" glyph="⇅" label="Toggle propulsor / turbine mode" />
      )}
      {showLaser && <TapButton keyName="x" glyph="✶" label="Fire laser" />}
    </div>
  );
}
