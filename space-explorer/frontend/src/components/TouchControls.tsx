// On-screen thrusters for touch devices. They mirror the keyboard layout by
// dispatching the same Arrow key events the controller already listens for, so no
// game logic is duplicated here.

interface ThrusterButtonProps {
  keyName: 'ArrowLeft' | 'ArrowUp' | 'ArrowRight';
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

export default function TouchControls() {
  return (
    <div className="touch-controls" aria-hidden={false}>
      <ThrusterButton keyName="ArrowLeft" glyph="◀" label="Left thruster" />
      <ThrusterButton keyName="ArrowUp" glyph="▲" label="Main thruster" />
      <ThrusterButton keyName="ArrowRight" glyph="▶" label="Right thruster" />
    </div>
  );
}
