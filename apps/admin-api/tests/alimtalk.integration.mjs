import { spawnSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { createRsbuild } from '@rsbuild/core';
const rsbuild = await createRsbuild({ rsbuildConfig: {
  splitChunks: false,
  source: { entry: { verify: { import: './tests/alimtalk.integration.ts', html: false } }, tsconfigPath: './tsconfig.app.json', decorators: { version: 'legacy' } },
  output: { target: 'node', distPath: { root: '.alimtalk-test-dist', js: '' }, module: true, minify: false, autoExternal: { dependencies: true, optionalDependencies: true, peerDependencies: true, exclude: [/^@pkg\//] } },
} });
try {
  await rsbuild.build();
  const result = spawnSync(process.execPath, ['.alimtalk-test-dist/verify.js'], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
}
finally { await rm('.alimtalk-test-dist', { recursive: true, force: true }); }
