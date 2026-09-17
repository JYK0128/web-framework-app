import { Router } from 'express';

import { env } from '~/config/env';
import { redisClient } from '~/config/redis';

type HealthRouteOptions = {
  isShuttingDown: () => boolean
};

const serviceName = 'admin-web-bff';

async function isServiceReady(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/api/v1/health`, {
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
    const [authServiceReady, adminApiReady] = await Promise.all([
      isServiceReady(env.AUTH_URL),
      isServiceReady(env.ADMIN_API_URL),
    ]);
    const checks = {
      redis: redisClient.isReady ? 'up' : 'down',
      authService: authServiceReady ? 'up' : 'down',
      adminApi: adminApiReady ? 'up' : 'down',
    };
    const isReady = !options.isShuttingDown()
      && checks.redis === 'up'
      && checks.authService === 'up'
      && checks.adminApi === 'up';

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ok' : 'error',
      service: serviceName,
      checks,
    });
  });

  return route;
}
