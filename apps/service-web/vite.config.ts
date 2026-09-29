import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.PORT || 3000);

  if (!env.APP_BASE_URL) {
    throw new Error('❌ Missing required environment variable: APP_BASE_URL');
  }

  return {
    resolve: {
      tsconfigPaths: true,
      dedupe: ['react', 'react-dom'],
    },
    server: {
      host: true,
      port,
      proxy: {
        '/api': {
          target: env.APP_BASE_URL,
          changeOrigin: true,
        },
      },
    },
    plugins: [
      tanstackStart({
        pages: [{ path: '/' }],
        prerender: {
          enabled: true,
          crawlLinks: false,
          autoStaticPathsDiscovery: false,
          failOnError: true,
        },
      }),
      tailwindcss(),
      react(),
    ],
  };
});
