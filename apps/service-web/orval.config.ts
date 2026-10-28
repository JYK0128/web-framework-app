import { existsSync } from 'node:fs';

import { defineConfig } from 'orval';
import { z } from 'zod';

import { normalizeGeneratedApi } from '../../packages/config/normalize-generated-api.mjs';

const envFile = existsSync('.env') ? '.env' : '.env.example';
if (existsSync(envFile)) process.loadEnvFile?.(envFile);

const targetUrl = z.url().parse(process.env.API_SPEC_URL);

export default defineConfig({
  api: {
    hooks: { afterAllFilesWrite: normalizeGeneratedApi },
    input: {
      target: targetUrl,
    },
    output: {
      mode: 'tags-split',
      target: 'src/.generated/api/endpoints',
      schemas: 'src/.generated/api/model',
      clean: true,
      client: 'react-query',
      httpClient: 'axios',
      mock: false,
      override: {
        mutator: {
          path: './src/lib/axios.ts',
          name: 'axios',
        },
      },
    },
  },
  zod: {
    hooks: { afterAllFilesWrite: normalizeGeneratedApi },
    input: {
      target: targetUrl,
    },
    output: {
      mode: 'tags-split',
      target: 'src/.generated/api/zod',
      clean: true,
      client: 'zod',
    },
  },
});
