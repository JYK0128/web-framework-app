import nodeConfig from '@pkg/config/eslint/node';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['src/**/*.ts', '*.config.{js,mjs,cjs,ts,mts,cts}'],
    extends: [nodeConfig],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@stylistic/max-statements-per-line': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/no-unenclosed-multiline-block': 'off',
    },
  },
]);
