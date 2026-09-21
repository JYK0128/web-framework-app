import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (!env.PORT) {
    throw new Error('❌ Missing required environment variable: PORT');
  }
  if (!env.USER_API_URL) {
    throw new Error('❌ Missing required environment variable: USER_API_URL');
  }

  return {
    resolve: {
      tsconfigPaths: true,
      dedupe: ['react', 'react-dom'],
    },
    server: {
      host: true,
      port: Number(env.PORT),
      proxy: {
        '/api': {
          target: env.USER_API_URL,
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
