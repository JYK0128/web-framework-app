import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    tsconfigPath: './tsconfig.server.json',
    entry: {
      main: './server/index.ts',
    },
  },
  output: {
    target: 'node',
    cleanDistPath: false,
    distPath: {
      root: 'dist',
      js: '',
    },
    module: true,
    sourceMap: true,
    autoExternal: {
      dependencies: true,
      optionalDependencies: true,
      peerDependencies: true,
      exclude: [/^@pkg\//],
    },
  },
});
