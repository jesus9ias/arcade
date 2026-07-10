import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Shared Vite configuration consumed by the Vitest test runner.
// Astro provides its own Vite pipeline for dev/build via astro.config.ts.
export default defineConfig({
  plugins: [react()],
});
