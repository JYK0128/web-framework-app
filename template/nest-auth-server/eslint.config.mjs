import nodeConfig from '@pkg/config/eslint/node';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['src/entities.generated.ts'],
  },
  ...nodeConfig,
  {
    settings: {
      'import-x/resolver': {
        typescript: {
          project: './tsconfig.app.json',
        },
      },
    },
  },
]);
