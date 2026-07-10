import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Test runner configuration. Extends the shared Vite config and restricts
// discovery to colocated unit tests under src/.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      environment: 'jsdom',
      globals: true,
      passWithNoTests: true,
    },
  }),
);
