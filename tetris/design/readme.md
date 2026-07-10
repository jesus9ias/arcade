# Tetris — design reference

Visual source of truth for the game's look and layout. **Reference only — not built, not deployed, not a workspace.**

## Provenance

Exported from **Claude Design** (claude.ai/design) as a handoff bundle on **2026-07-09** (project "Diseño mejorado de Tetris clásico"). The developer mocked up the design there and handed it off for implementation.

## Files

| File | What it is |
|---|---|
| `Tetris.dc.html` | The primary design markup — the clean, readable source for exact colors, dimensions, spacing, fonts, glows, and layout. This is what to read when a build detail is in doubt. |
| `reference.png` | A rendered screenshot of the design for a quick visual reference. |

`Tetris.dc.html` uses Claude Design's `x-dc` template runtime (`support.js`, not included here — it is a proprietary runtime, ~64 KB of noise). The file is meant to be **read**, not rendered (per the handoff README). The `{{ ... }}` / `<sc-for>` / `<sc-if>` tokens are the design tool's binding placeholders; treat them as illustrative sample data, not part of the real UI.

## How this relates to the spec

The authoritative **build contract** is the `Design & Layout` section of [`../spec.md`](../spec.md), not these files. Where they differ, the spec wins — it captures the deliberate, developer-approved divergences from this mock:

- Next queue shows **5** pieces (the prose "max 4" was overridden here).
- A **counterclockwise rotate button** is added to the bottom bar (the mock shows only one rotate button).
- Fonts (Orbitron, Space Grotesk) are **self-hosted** (the mock loads them from Google Fonts; the CSP forbids external resources). Download the real `.woff2` from Google Fonts at implementation time — do not extract them from the design bundle.
- **Dark-only**; no light/dark theme toggle.

Everything else — the neon palette, borders, glows, cell sizing (26px cells, 2px gaps), panel structure, radial background, and scanline overlay — should be recreated faithfully from `Tetris.dc.html`.

## Piece palette (mirror of `Tetris.dc.html`)

| Piece | Main | Glow |
|---|---|---|
| I | `#37e0e0` | `rgba(55,224,224,0.65)` |
| O | `#e8d84a` | `rgba(232,216,74,0.65)` |
| T | `#b355f2` | `rgba(179,85,242,0.65)` |
| S | `#3fd66b` | `rgba(63,214,107,0.65)` |
| Z | `#f2455a` | `rgba(242,69,90,0.65)` |
| J | `#3d6bf2` | `rgba(61,107,242,0.65)` |
| L | `#f2954a` | `rgba(242,149,74,0.65)` |

Empty cell `#12161f`; page background `radial-gradient(ellipse at 50% -10%, #1a2140 0%, #0a0d16 55%, #05060a 100%)`.
