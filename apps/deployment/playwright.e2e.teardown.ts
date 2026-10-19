import { execFileSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';

export default function globalTeardown(): void {
  try {
    if (!existsSync(`${__dirname}/.env.e2e`)) return;
    execFileSync('docker', [
      'compose', '--project-name', 'service-factory-apps-e2e', '--env-file', `${__dirname}/.env.e2e`, '-f', 'docker-compose.e2e.yml',
      'down', '--volumes', '--remove-orphans',
    ], { cwd: __dirname, stdio: 'inherit' });
  }
  finally {
    try { unlinkSync(`${__dirname}/.env.e2e`); }
    catch { /* Setup may have failed before creating it. */ }
  }
}
