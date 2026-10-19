// Set SERVICE_TERMS_TEST_DATABASE_URL to a disposable service_terms_test_* database to include PostgreSQL checks.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { createRsbuild } from '@rsbuild/core';

const output = '.domain-structure-test-dist';
const build = await createRsbuild({ rsbuildConfig: {
  splitChunks: false,
  source: { entry: { verify: { import: './tests/domain-structure.regression.ts', html: false } }, tsconfigPath: './tsconfig.app.json', decorators: { version: 'legacy' } },
  output: { target: 'node', distPath: { root: output, js: '' }, module: true, minify: false, autoExternal: { dependencies: true, optionalDependencies: true, peerDependencies: true, exclude: [/^@pkg\//] } },
} });
try {
  await build.build();
  const env = { ...process.env, NODE_ENV: 'test', PORT: '14000', APP_SECRET: randomBytes(32).toString('base64url'), DATABASE_URL: 'postgresql://test:test@localhost:5432/test', REDIS_URL: 'redis://localhost:6379', LOKI_URL: 'http://localhost:3100', ADMIN_API_URL: 'http://localhost:14000', APP_BASE_URL: 'http://localhost:14000', PORTONE_API_SECRET: 'test-only' };
  process.exitCode = spawnSync(process.execPath, [`${output}/verify.js`], { env, stdio: 'inherit' }).status ?? 1;
}
finally { await rm(output, { recursive: true, force: true }); }
