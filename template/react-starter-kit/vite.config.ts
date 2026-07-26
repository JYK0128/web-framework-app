import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { createLocalizedPages } from './vite.tanstack.helper';

export default defineConfig(async () => ({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({
      pages: await createLocalizedPages(),
      prerender: {
        enabled: true,
        crawlLinks: false,
        autoStaticPathsDiscovery: false,
        failOnError: false,
      },
    }),
    tailwindcss(),
    react(),
  ],
  server: {
    port: 3000,
  },
}));
