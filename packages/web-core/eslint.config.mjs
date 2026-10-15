import reactConfig from '@pkg/config/eslint/react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  { ignores: ['src/.generated/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactConfig],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          project: 'tsconfig.json',
        },
      },
    },
  },
]);
