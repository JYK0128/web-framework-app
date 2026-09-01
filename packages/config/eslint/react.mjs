import { defineConfig } from 'eslint/config';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import globals from 'globals';

import baseConfig from './base.mjs';

/** @type {import("eslint").Linter.Config[]} */
export default defineConfig([
  baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    extends: [
      reactPlugin.configs.flat['recommended'],
      reactPlugin.configs.flat['jsx-runtime'],
      reactHooks.configs.flat['recommended'],
      reactRefreshPlugin.configs['vite'],
    ],
    files: ['**/*.{jsx,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'function-declaration',
          unnamedComponents: 'arrow-function',
        },
      ],
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            'Redirect',
            'NotFound',
            'NotFoundError',
            {
              from: 'package',
              package: '@tanstack/react-router',
              name: 'Redirect',
            },
            {
              from: 'package',
              package: '@tanstack/react-router',
              name: 'NotFound',
            },
            {
              from: 'package',
              package: '@tanstack/react-router',
              name: 'NotFoundError',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    extends: [betterTailwindcss.configs['recommended']],
    rules: {
      'better-tailwindcss/no-unknown-classes': 'off',
      'better-tailwindcss/enforce-consistent-class-order': 'off',
      'better-tailwindcss/enforce-consistent-line-wrapping': ['warn',
        {
          group: 'newLine',
          preferSingleLine: false,
        }],
    },
  },
]);
