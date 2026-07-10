# Self-hosted fonts (pending assets)

Per spec Deviation 2, the design fonts are self-hosted (no Google CDN, CSP-safe).
Drop the real WOFF2 files here so `@font-face` in `src/styles/global.css` resolves:

- `orbitron.woff2` — Orbitron (weights 600–800), display wordmark/titles
- `space-grotesk.woff2` — Space Grotesk (weights 400–700), body text

Download from Google Fonts (or a licensed source) and place them here. Until then
the CSS falls back to system fonts (`Segoe UI`, `system-ui`). Do not extract the
fonts from the design bundle — fetch them fresh.
