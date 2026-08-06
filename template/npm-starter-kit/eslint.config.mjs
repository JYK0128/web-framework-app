import nodeConfig from '@pkg/config/eslint/node';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  nodeConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
