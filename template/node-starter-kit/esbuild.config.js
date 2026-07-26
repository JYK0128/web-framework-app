import { context as createContext } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import { copy } from 'esbuild-plugin-copy';
import { run } from 'esbuild-plugin-run';
import { swcPlugin } from 'esbuild-plugin-swc';

const isWatching = process.argv.includes('--watch');

async function build() {
  const ctx = await createContext({
    tsconfig: './tsconfig.app.json',
    entryPoints: ['src/main.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    outfile: 'dist/main.js',
    sourcemap: 'inline',
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
    plugins: [
      nodeExternalsPlugin({
        allowList: [/^@pkg\//],
      }),
      swcPlugin({
        sourceMaps: 'inline',
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          target: 'esnext',
          keepClassNames: true,
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
      isWatching && run(),
    ].filter(Boolean),
  });

  if (isWatching) {
    await ctx.watch();
    console.log('[esbuild] Watching for file changes...');
  }
  else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('[esbuild] Build succeeded');
  }
}

build().catch((err) => {
  console.error('[esbuild] Build failed:', err);
  process.exit(1);
});
