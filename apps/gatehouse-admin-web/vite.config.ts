import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.API_PROXY_TARGET ?? 'http://localhost:4200';

  return {
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      tanstackStart({
      }),
      tailwindcss(),
      nitro({
        preset: 'node-server',
        routeRules: {
          '/api/**': {
            proxy: {
              to: `${apiProxyTarget}/api/**`,
              fetchOptions: { redirect: 'manual' },
            },
          },
        },
      }),
      react(),
    ],
    server: {
      host: true,
      port: Number(env.PORT || 3200),
    },
  };
});
