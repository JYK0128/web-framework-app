import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    entry: { main: './src/main.ts' },
    decorators: { version: 'legacy' },
  },
  output: {
    target: 'node',
    distPath: { root: 'dist', js: '' },
    module: true,
    sourceMap: true,
    autoExternal: {
      dependencies: true,
      optionalDependencies: true,
      peerDependencies: true,
    },
  },
});
