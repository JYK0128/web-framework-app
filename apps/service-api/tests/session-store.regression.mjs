import { spawnSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { createRsbuild } from '@rsbuild/core';

const output = '.session-store-test-dist';
const build = await createRsbuild({ rsbuildConfig: {
  splitChunks: false,
  source: { entry: { verify: { import: './tests/session-store.regression.ts', html: false } }, tsconfigPath: './tsconfig.app.json', decorators: { version: 'legacy' } },
  output: { target: 'node', distPath: { root: output, js: '' }, module: true, minify: false, autoExternal: { dependencies: true, optionalDependencies: true, peerDependencies: true, exclude: [/^@pkg\//] } },
} });
try {
  await build.build();
  process.exitCode = spawnSync(process.execPath, [`${output}/verify.js`], { stdio: 'inherit' }).status ?? 1;
}
finally { await rm(output, { recursive: true, force: true }); }
