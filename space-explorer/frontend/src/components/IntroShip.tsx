// Reusable explorer-ship silhouette, modelled on the reference art: a rounded,
// chubby rocket with a central porthole, two side pods and splayed tail fins.
// No exhaust flame — in space there is nothing to burn. Returns an SVG <g>
// drawn around its local origin (roughly x ∈ [-27, 27], y ∈ [-44, 48]); scenes
// place and scale it via a transform on the wrapping element.

interface Props {
  /** Extra class on the ship group, for scene-specific motion. */
  className?: string;
}

export default function IntroShip({ className }: Props) {
  return (
    <g className={className ? `intro-ship ${className}` : 'intro-ship'}>
      {/* Tail fins, drawn behind the body */}
      <path
        className="intro-ship__fin"
        d="M -10 26 C -18 32 -25 40 -26 48 C -18 46 -11 42 -6 35 Z"
      />
      <path
        className="intro-ship__fin"
        d="M 10 26 C 18 32 25 40 26 48 C 18 46 11 42 6 35 Z"
      />

      {/* Side pods / boosters */}
      <ellipse className="intro-ship__pod" cx="-23" cy="9" rx="5.5" ry="10" />
      <ellipse className="intro-ship__pod" cx="23" cy="9" rx="5.5" ry="10" />

      {/* Hull */}
      <path
        className="intro-ship__body"
        d="M 0 -44 C 15 -44 25 -22 22 -5 C 21 9 18 23 12 33 C 8 38 4 41 0 41 C -4 41 -8 38 -12 33 C -18 23 -21 9 -22 -5 C -25 -22 -15 -44 0 -44 Z"
      />

      {/* Porthole */}
      <circle className="intro-ship__ring" cx="0" cy="-6" r="13" />
      <circle className="intro-ship__glass" cx="0" cy="-6" r="9" />
      <circle className="intro-ship__glass-hi" cx="-3" cy="-9" r="4" />
      <circle className="intro-ship__glint" cx="4" cy="-2" r="1.6" />
    </g>
  );
}
