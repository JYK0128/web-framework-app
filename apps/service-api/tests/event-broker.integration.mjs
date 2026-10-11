import { spawnSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { createRsbuild } from '@rsbuild/core';
const rsbuild = await createRsbuild({ rsbuildConfig: {
 splitChunks: false,
 source: { entry: { verify: { import: './tests/event-broker.integration.ts', html: false } }, tsconfigPath: './tsconfig.app.json', decorators: { version: 'legacy' } },
 output: { target: 'node', distPath: { root: '.event-broker-test-dist', js: '' }, module: true, minify: false, autoExternal: { dependencies: true, optionalDependencies: true, peerDependencies: true, exclude: [/^@pkg\//] } },
} });
try {
  await rsbuild.build();
  const result = spawnSync(process.execPath, ['.event-broker-test-dist/verify.js', ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
}
finally {
  await rm('.event-broker-test-dist', { recursive: true, force: true });
}
