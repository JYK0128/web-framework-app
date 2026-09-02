import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import { flatConfigs as importXFlatConfigs } from 'eslint-plugin-import-x';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { configs as sonarConfigs } from 'eslint-plugin-sonarjs';
import unusedImports from 'eslint-plugin-unused-imports';
import { configs as tsConfigs } from 'typescript-eslint';

import importSingleLineRule from './import-single-line.mjs';
import noAliasForGeneratedTypesRule from './no-alias-for-generated-types.mjs';
import objectPatternPropertyNewlineRule from './object-pattern-property-newline.mjs';

/** @type {import("eslint").Linter.Config[]} */
export default defineConfig([
  globalIgnores(['node_modules', 'dist', '.next', '.turbo']),
  { files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'] },
  {
    extends: [js.configs['recommended']],
    rules: {
      'eqeqeq': ['error', 'always'],
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tsConfigs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    extends: [tsConfigs.disableTypeChecked],
  },
  {
    extends: [stylistic.configs['disable-legacy'], stylistic.configs['recommended']],
    plugins: {
      'local-style': {
        rules: {
          ...objectPatternPropertyNewlineRule.rules,
          ...importSingleLineRule.rules,
        },
      },
    },
    rules: {
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/no-multi-spaces': ['error',
        { ignoreEOLComments: true },
      ],
      '@stylistic/no-multiple-empty-lines': ['error',
        { max: 1, maxBOF: 0, maxEOF: 0 },
      ],
      '@stylistic/object-property-newline': ['error',
        { allowAllPropertiesOnSameLine: true },
      ],
      'local-style/object-pattern-property-newline': 'error',
      'local-style/import-single-line': 'error',
      '@stylistic/array-element-newline': ['error',
        {
          ArrayExpression: { multiline: true, consistent: true },
          ArrayPattern: { multiline: true, consistent: true },
        },
      ],
      '@stylistic/indent': ['error',
        2,
        {
          ImportDeclaration: 'first',
          SwitchCase: 1,
          flatTernaryExpressions: true,
        },
      ],
      '@stylistic/multiline-ternary': ['error', 'always-multiline'],
      '@stylistic/object-curly-newline': ['error',
        {
          ObjectExpression: { multiline: true, consistent: true },
          ObjectPattern: { multiline: true, consistent: true },
          ImportDeclaration: 'never',
          ExportDeclaration: 'never',
        },
      ],
      '@stylistic/jsx-self-closing-comp': ['error',
        {
          component: true,
          html: true,
        },
      ],
    },
  },
  {
    extends: [sonarConfigs.recommended],
    rules: {
      'sonarjs/todo-tag': 'warn',
      'sonarjs/no-small-switch': 'warn',
      'sonarjs/no-nested-functions': 'warn',
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/no-dead-store': 'off',
      'sonarjs/no-nested-conditional': 'warn',
      'sonarjs/table-header': 'warn',
      'sonarjs/prefer-read-only-props': 'off',
      'sonarjs/no-redundant-optional': 'off',
      'sonarjs/no-alphabetical-sort': 'off',
      'sonarjs/function-return-type': 'off',
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
      'no-relative-import-paths': noRelativeImportPaths,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          allowSameFolder: true,
          rootDir: 'src',
          prefix: '#',
        },
      ],
    },
  },
  {
    files: ['*.{js,jsx,ts,tsx,mjs,cjs}'],
    rules: {
      'no-relative-import-paths/no-relative-import-paths': 'off',
    },
  },
  {
    extends: [importXFlatConfigs.recommended, importXFlatConfigs.typescript],
    settings: {
      'import-x/resolver': {
        typescript: {
          project: 'tsconfig.json',
        },
      },
    },
    rules: {
      'import-x/export': 'off',
      'import-x/extensions': ['error', 'never', { json: 'always' }],
      'import-x/no-duplicates': ['error', { 'prefer-inline': true }],
      'import-x/first': 'error',
      'import-x/newline-after-import': ['error', { count: 1, exactCount: true, considerComments: true }],
      'import-x/no-useless-path-segments': 'error',
      'import-x/consistent-type-specifier-style': 'off',
      'import-x/order': 'off',
    },
  },
  {
    files: ['**/src/routes/_protected/**/*.{ts,tsx}'],
    plugins: {
      generated: noAliasForGeneratedTypesRule,
    },
    rules: {
      'generated/no-alias-for-generated-types': 'error',
    },
  },
]);
