import reactConfig from '@pkg/config/eslint/react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: [
      'src/.generated/**',
      'src/components/form/**',
      'src/components/data-grid/**',
      'src/components/chart/**',
    ],
  },
  reactConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
