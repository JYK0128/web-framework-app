import nodeConfig from '@pkg/config/eslint/node';
import { defineConfig } from 'eslint/config';

export default defineConfig([
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
