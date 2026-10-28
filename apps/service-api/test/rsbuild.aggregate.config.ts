import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  splitChunks: false,
  source: {
    entry: { aggregate: { import: './test/aggregate.integration.test.ts', html: false } },
    tsconfigPath: './tsconfig.app.json',
    decorators: { version: 'legacy' },
  },
  output: {
    target: 'node',
    distPath: { root: 'tmp/aggregate-test', js: '' },
    cleanDistPath: true,
    minify: false,
    module: true,
    autoExternal: {
      dependencies: true,
      optionalDependencies: true,
      peerDependencies: true,
      exclude: [/^@pkg\//],
    },
  },
});
