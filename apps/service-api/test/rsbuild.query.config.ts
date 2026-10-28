import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  splitChunks: false,
  source: {
    entry: { query: { import: './test/query-request.test.ts', html: false } },
    tsconfigPath: './tsconfig.app.json',
    decorators: { version: 'legacy' },
  },
  output: {
    target: 'node',
    distPath: { root: 'tmp/query-test', js: '' },
    cleanDistPath: true,
    minify: false,
    module: true,
    autoExternal: { dependencies: true, optionalDependencies: true, peerDependencies: true, exclude: [/^@pkg\//] },
  },
});
