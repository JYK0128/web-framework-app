import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig, loadEnv } from 'vite';
import { z } from 'zod';

export default defineConfig(({ mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), '');
  const env = z.object({
    PORT: z.coerce.number().int().positive(),
    API_BASE_URL: z.url(),
  }).parse(loadedEnv);

  for (const key of ['NODE_ENV', 'PORT', 'APP_NAME', 'API_BASE_URL', 'APP_BASE_URL', 'SESSION_SECRET'] as const) {
    const value = loadedEnv[key];
    if (Object.hasOwn(loadedEnv, key)) process.env[key] = value;
  }

  return {
    // Nitro가 SSR 산출물을 재번들링할 때 청크 간 초기화 순서가 바뀌지 않도록 한다.
    environments: { ssr: { build: { rolldownOptions: { output: { codeSplitting: false } } } } },
    resolve: {
      tsconfigPaths: true,
      dedupe: ['react', 'react-dom'],
    },
    server: {
      host: true,
      port: env.PORT,
    },
    plugins: [
      tanstackStart(),
      nitro({
        preset: 'node-server',
        serverDir: './server',
        // API paths with file extensions must reach the session proxy in development too.
        handlers: [{ route: '/api/**', handler: './server/api.ts' }],
      }),
      tailwindcss(),
      react(),
    ],
  };
});
