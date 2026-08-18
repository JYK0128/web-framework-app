import { existsSync, rmSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';

import { context as createContext } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import { copy } from 'esbuild-plugin-copy';
import { swcPlugin } from 'esbuild-plugin-swc';

const OUTDIR = 'dist';
const isWatching = process.argv.includes('--watch');

const entryPoints = [
  'src/main.ts',
  'src/database/mikro-orm.config.ts',
  'src/database/migrations/*.ts',
  'src/database/seeders/*.ts',
];

const sourceJsToTsPlugin = {
  name: 'source-js-to-ts',
  setup(build) {
    build.onResolve({ filter: /^\.\.?\// }, (args) => {
      if (!args.path.endsWith('.js')) return;

      const sourcePath = resolvePath(dirname(args.importer), `${args.path.slice(0, -3)}.ts`);
      if (existsSync(sourcePath)) {
        return { path: sourcePath };
      }

      return undefined;
    });
  },
};

async function build() {
  if (!isWatching) {
    rmSync(OUTDIR, { recursive: true, force: true });
  }

  const ctx = await createContext({
    tsconfig: './tsconfig.app.json',
    entryPoints,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    outdir: OUTDIR,
    outbase: 'src',
    external: ['@socket.io/redis-adapter'],
    minify: !isWatching,
    keepNames: true,
    sourcemap: isWatching ? 'inline' : true,
    logLevel: 'info',
    plugins: [
      nodeExternalsPlugin({
        allowList: [/^@pkg\//],
      }),
      sourceJsToTsPlugin,
      swcPlugin({
        sourceMaps: 'inline',
        jsc: {
          baseUrl: process.cwd(),
          parser: {
            syntax: 'typescript',
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          target: 'es2022',
          keepClassNames: true,
        },
        module: {
          type: 'es6',
        },
      }),
      copy({
        resolveFrom: 'cwd',
        assets: {
          from: ['./src/assets/**/*'],
          to: ['./dist/assets'],
        },
        watch: isWatching,
      }),
    ],
  });

  if (isWatching) {
    await ctx.watch();
    console.log('[esbuild] Watching for file changes...');
    return;
  }

  await ctx.rebuild();
  await ctx.dispose();
  console.log('[esbuild] Build succeeded');
}

build().catch((error) => {
  console.error('[esbuild] Build failed:', error);
  process.exit(1);
});
