import reactConfig from '@pkg/config/eslint/react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  { ignores: ['src/.generated/**'] },
  {
    files: ['src/**/*.{ts,tsx}', 'stories/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    extends: [reactConfig],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        projectService: false,
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
