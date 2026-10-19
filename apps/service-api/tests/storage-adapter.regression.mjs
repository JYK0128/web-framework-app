import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRsbuild } from '@rsbuild/core';

const entry = fileURLToPath(new URL('./storage-adapter.regression.ts', import.meta.url));
for (const api of ['service-api', 'admin-api']) {
  const root = fileURLToPath(new URL(`../../${api}/`, import.meta.url));
  process.chdir(root);
  const output = '.storage-adapter-test-dist';
  const directory = await mkdtemp(join(tmpdir(), 'storage-adapter-'));
  const build = await createRsbuild({ rsbuildConfig: {
    splitChunks: false,
    source: { entry: { verify: { import: entry, html: false } }, tsconfigPath: './tsconfig.app.json', decorators: { version: 'legacy' } },
    output: { target: 'node', distPath: { root: output, js: '' }, module: true, minify: false, autoExternal: { dependencies: true, optionalDependencies: true, peerDependencies: true, exclude: [/^@pkg\//] } },
  } });
  try {
    await build.build();
    const env = { ...process.env, NODE_ENV: 'test', PORT: '14000', APP_SECRET: randomBytes(32).toString('base64url'), DATABASE_URL: 'postgresql://test:test@localhost:5432/test', REDIS_URL: 'redis://localhost:6379', LOKI_URL: 'http://localhost:3100', ADMIN_API_URL: 'http://localhost:14000', SERVICE_API_URL: 'http://localhost:14001', APP_BASE_URL: 'http://localhost:14000', PORTONE_API_SECRET: 'test-only' };
    for (const key of Object.keys(env)) if (key.startsWith('STORAGE_S3_')) delete env[key];
    const result = spawnSync(process.execPath, [join(root, output, 'verify.js')], { cwd: directory, env, stdio: 'inherit' });
    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
      break;
    }
  }
  finally {
    await rm(directory, { recursive: true, force: true });
    await rm(join(root, output), { recursive: true, force: true });
  }
}
