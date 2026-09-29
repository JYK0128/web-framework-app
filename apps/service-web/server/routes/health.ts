import { API_BASE_PATH } from '@pkg/shared/common';
import { Router } from 'express';

import { env } from '~/config/env';
import { WEB_RUNTIME_CONFIG } from '~/config/runtime.config';

type HealthRouteOptions = {
  isShuttingDown: () => boolean
};

const serviceName = 'service-web';

async function isServiceReady(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}${API_BASE_PATH}/health/live`, {
      signal: AbortSignal.timeout(WEB_RUNTIME_CONFIG.healthCheckTimeoutMilliseconds),
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
    const serviceApiReady = await isServiceReady(env.APP_BASE_URL);
    const checks = {
      serviceApi: serviceApiReady ? 'up' : 'down',
    };
    const isReady = !options.isShuttingDown() && checks.serviceApi === 'up';

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ok' : 'error',
      service: serviceName,
      checks,
    });
  });

  return route;
}
