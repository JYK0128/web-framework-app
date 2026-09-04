import baseConfig from '@pkg/config/eslint/base';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-relative-import-paths/no-relative-import-paths': 'off',
    },
  },
]);
