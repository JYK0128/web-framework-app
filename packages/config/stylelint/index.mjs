/** @type {import('stylelint').Config} */
export default {
  ignoreFiles: [
    'node_modules/**/*',
    'dist/**/*',
    'build/**/*',
  ],
  files: [
    '**/*.{css,scss}',
  ],
  extends: [
    'stylelint-config-recommended',
    'stylelint-config-tailwindcss',
    'stylelint-config-clean-order',
    '@stylistic/stylelint-config',
  ],
  rules: {
    '@stylistic/indentation': 2,
    '@stylistic/string-quotes': 'single',
    '@stylistic/selector-list-comma-newline-after': 'never-multi-line',
    '@stylistic/max-line-length': null,
    'no-invalid-position-at-import-rule': null,
  },
};
