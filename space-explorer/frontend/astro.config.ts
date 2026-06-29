import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { loadEnv } from 'vite';

// Read the public site URL from .env (PUBLIC_ prefix). Never hardcode a domain.
const { PUBLIC_SITE_URL } = loadEnv(
  process.env.NODE_ENV ?? 'production',
  process.cwd(),
  'PUBLIC_',
);

// https://astro.build/config
export default defineConfig({
  site: PUBLIC_SITE_URL,
  integrations: [react()],
});
