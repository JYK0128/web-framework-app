/** @type {import("eslint").Linter.Config} */
export default {
  ignores: ['**/index.{js,jsx,ts,tsx,mjs,cjs}'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ExportAllDeclaration',
        message: 'Re-exports are only allowed in index files.',
      },
      {
        selector: 'ExportNamedDeclaration[source!=null]',
        message: 'Re-exports are only allowed in index files.',
      },
    ],
  },
};
