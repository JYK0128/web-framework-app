import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const deploymentDir = path.dirname(fileURLToPath(import.meta.url));
const apps = ['admin-api', 'admin-web', 'service-api', 'service-web'];
const [requestedApp] = process.argv.slice(2);

if (process.argv.length > 3 || (requestedApp && !apps.includes(requestedApp))) {
  console.error(`Usage: node scripts/build-images.mjs [${apps.join('|')}]`);
  process.exit(2);
}

const env = { ...process.env };

for (const app of apps) {
  const appKey = app.replaceAll('-', '_').toUpperCase();
  const envFile = path.join(deploymentDir, 'env', app, '.env.prd');
  env[`${appKey}_DOTENV_PRD_REVISION`] = createHash('sha256')
    .update(readFileSync(envFile))
    .digest('hex');
}

const composeArgs = [
  'exec', 'dotenvx', 'run',
  '-f', 'env/.env.keys',
  '-f', 'env/.env.prd',
  '--', 'docker', 'compose',
  '-f', 'docker-compose.prd.yml',
  '-f', 'docker-compose.build.yml',
  'build',
  ...(requestedApp ? [requestedApp] : []),
];

const result = spawnSync('pnpm', composeArgs, {
  cwd: deploymentDir,
  env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exitCode = result.status ?? 1;
