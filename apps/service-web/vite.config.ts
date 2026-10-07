import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.PORT || 3000);

  if (!env.API_BASE_URL) {
    throw new Error('❌ Missing required environment variable: API_BASE_URL');
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
      port,
    },
    plugins: [
      tanstackStart(),
      nitro({
        preset: 'node-server',
        serverDir: './server',
      }),
      tailwindcss(),
      react(),
    ],
  };
});
