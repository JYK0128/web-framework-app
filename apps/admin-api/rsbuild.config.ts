import { globSync } from 'node:fs';
import { dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@rsbuild/core';

const root = dirname(fileURLToPath(import.meta.url));
const isWatching = process.argv.includes('--watch');

const entryPoints = [
  'src/main.ts',
  'src/infra/database/mikro-orm.config.ts',
  ...globSync('src/infra/database/migrations/*.ts', { cwd: root }),
  ...globSync('src/infra/database/seeders/*.ts', { cwd: root }),
];

const entries = entryPoints.reduce<Record<string, { import: string, html: false }>>(
  (result, entryPoint) => {
    const normalizedPath = entryPoint.split(sep).join('/');
    const entryName = normalizedPath.replace(/^src\//, '').replace(/\.ts$/, '');

    result[entryName] = {
      import: `./${normalizedPath}`,
      html: false,
    };

    return result;
  },
  {},
);

export default defineConfig({
  splitChunks: false,
  source: {
    entry: {
      ...entries,
    },
    tsconfigPath: './tsconfig.app.json',
    decorators: {
      version: 'legacy',
    },
  },
  output: {
    target: 'node',
    distPath: {
      root: 'dist',
      js: '',
    },
    cleanDistPath: !isWatching,
    minify: false,
    sourceMap: true,
    module: true,
    autoExternal: {
      dependencies: true,
      optionalDependencies: true,
      peerDependencies: true,
      exclude: [/^@pkg\//],
    },
  },
});
