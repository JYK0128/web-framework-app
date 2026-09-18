import { Router } from 'express';

import { env } from '~/config/env';

type HealthRouteOptions = {
  isShuttingDown: () => boolean
};

const serviceName = 'admin-web';

async function isServiceReady(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/api/v1/health/live`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  }
  catch {
    return false;
  }
}

export function createHealthRoute(options: HealthRouteOptions): Router {
  const route = Router();

  route.get('/health/live', (_req, res) => {
    res.json({ status: 'ok', service: serviceName });
  });

  route.get('/health/ready', async (_req, res) => {
    const adminApiReady = await isServiceReady(env.ADMIN_API_URL);
    const checks = {
      adminApi: adminApiReady ? 'up' : 'down',
    };
    const isReady = !options.isShuttingDown() && checks.adminApi === 'up';

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ok' : 'error',
      service: serviceName,
      checks,
    });
  });

  return route;
}
