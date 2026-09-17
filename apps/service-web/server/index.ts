import { createServer, type Server } from 'node:http';

import { ApplicationError } from '@pkg/shared/common';
import express, { json } from 'express';

import { env } from '~/config/env';
import { closeRedis, connectRedis } from '~/config/redis';
import { sessionMiddleware } from '~/config/session';
import { errorMiddleware } from '~/middleware/error';
import { securityMiddleware } from '~/middleware/security';
import { createRoute } from '~/routes/route';

const shutdownTimeoutMs = 10_000;

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(ApplicationError.from(error, 'SERVER_CLOSE_FAILED'));
      else resolve();
    });
  });
}

async function bootstrap(): Promise<void> {
  await connectRedis();

  let isShuttingDown = false;
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(securityMiddleware);
  app.use(sessionMiddleware);
  app.use(json({ limit: '1mb' }));
  app.use(createRoute({ isShuttingDown: () => isShuttingDown }));
  app.use(errorMiddleware);

  const server = createServer(app);
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`${signal} received; shutting down service-web BFF`);

    const timeout = setTimeout(() => {
      console.error('Graceful shutdown timed out');
      process.exit(1);
    }, shutdownTimeoutMs);
    timeout.unref();

    try {
      await closeServer(server);
      await closeRedis();
    }
    catch (error) {
      console.error(ApplicationError.from(error, 'GRACEFUL_SHUTDOWN_FAILED'));
      process.exitCode = 1;
    }
    finally {
      clearTimeout(timeout);
    }
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
  server.listen(env.PORT, () => console.log(`service-web BFF listening on :${env.PORT}`));
}

await bootstrap();
