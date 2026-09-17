import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Router, static as serveStatic } from 'express';

import { csrfTokenMiddleware } from '~/middleware/security';
import { createHealthRoute } from '~/routes/health';
import { proxyMiddleware } from '~/routes/proxy';

const publicDirectory = join(process.cwd(), 'dist', 'client');

type RouteOptions = {
  isShuttingDown: () => boolean
};

export function createRoute(options: RouteOptions): Router {
  const route = Router();

  route.use(createHealthRoute(options));
  route.get('/csrf-token', csrfTokenMiddleware);

  route.use('/api', proxyMiddleware);
  route.use(serveStatic(publicDirectory, { index: false }));
  route.get(/.*/, async (_req, res, next) => {
    try {
      const html = await readFile(join(publicDirectory, 'index.html'), 'utf8');
      const nonce = res.locals.cspNonce as string;
      const htmlWithNonce = html.replaceAll('<script', `<script nonce="${nonce}"`);
      res.type('html').send(htmlWithNonce);
    }
    catch (error) {
      next(error);
    }
  });

  return route;
}
