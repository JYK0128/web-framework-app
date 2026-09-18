import nodeConfig from '@pkg/config/eslint/node';
import reactConfig from '@pkg/config/eslint/react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  { ignores: ['src/.generated/**'] },
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
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
          project: 'tsconfig.app.json',
        },
      },
    },
  },
  {
    files: [
      'src/{main,server,start}.ts',
      'server/**/*.ts',
      '*.config.{js,mjs,cjs,ts,mts,cts}',
    ],
    extends: [nodeConfig],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          project: 'tsconfig.server.json',
        },
      },
    },
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          allowSameFolder: true,
          rootDir: 'server',
          prefix: '~',
        },
      ],
    },
  },
]);
