import { defineConfig } from 'eslint/config';
import globals from 'globals';

import baseConfig from './base.mjs';

/** @type {import("eslint").Linter.Config[]} */
export default defineConfig([
  baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
]);
