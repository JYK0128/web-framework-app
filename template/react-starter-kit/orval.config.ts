import { defineConfig } from 'orval';

const targetUrl = process.env.API_SPEC_URL;

if (!targetUrl) {
  throw new Error('❌ Missing required environment variable: API_SPEC_URL');
}

export default defineConfig({
  api: {
    input: {
      target: targetUrl,
    },
    output: {
      mode: 'tags-split',
      target: 'src/.generated/api/endpoints',
      schemas: 'src/.generated/api/model',
      client: 'react-query',
      httpClient: 'axios',
      mock: false,
      override: {
        mutator: {
          path: './src/core/config/axios.ts',
          name: 'axios',
        },
      },
    },
  },
  zod: {
    input: {
      target: targetUrl,
    },
    output: {
      mode: 'tags-split',
      target: 'src/.generated/api/zod',
      client: 'zod',
    },
  },
});
