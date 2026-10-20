import { config as dotenvxConfig } from '@dotenvx/dotenvx';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  if (command === 'serve') dotenvxConfig({ quiet: true });

  return {
    // Nitro가 SSR 산출물을 재번들링할 때 청크 간 초기화 순서가 바뀌지 않도록 한다.
    environments: { ssr: { build: { rolldownOptions: { output: { codeSplitting: false } } } } },
    resolve: {
      tsconfigPaths: true,
      dedupe: ['react', 'react-dom'],
    },
    server: {
      host: true,
      port: process.env.PORT ? Number(process.env.PORT) : undefined,
    },
    plugins: [
      tanstackStart({
        prerender: {
          enabled: true,
          autoStaticPathsDiscovery: false,
          crawlLinks: false,
          failOnError: true,
        },
        pages: [
          { path: '/', prerender: { enabled: true } },
          { path: '/en', prerender: { enabled: true } },
          { path: '/ko', prerender: { enabled: true } },
        ],
      }),
      nitro({
        preset: 'node-server',
        serverDir: './server',
      }),
      tailwindcss(),
      react(),
    ],
  };
});
