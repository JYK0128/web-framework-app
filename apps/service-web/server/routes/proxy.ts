import { randomUUID } from 'node:crypto';

import type { Request, Response } from 'express';

import { env } from '~/config/env';
import { regenerateSession } from '~/config/session';

type AuthLoginPayload = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: unknown
};

export async function proxyMiddleware(req: Request, res: Response): Promise<void> {
  const requestUrl = new URL(req.originalUrl, env.AUTH_URL);
  const upstreamUrl = requestUrl.pathname.startsWith('/api/v1/auth/')
    ? env.AUTH_URL
    : env.SERVICE_API_URL;
  const url = new URL(`${requestUrl.pathname}${requestUrl.search}`, upstreamUrl);
  const isLogin = req.method === 'POST' && url.pathname === '/api/v1/auth/login';
  const headers = new Headers({
    'accept': req.header('accept') ?? 'application/json',
    'content-type': req.header('content-type') ?? 'application/json',
    'x-request-id': req.header('x-request-id') ?? randomUUID(),
  });
  if (req.session.accessToken)
    headers.set('authorization', `Bearer ${req.session.accessToken}`);

  const response = await fetch(url, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD'
      ? undefined
      : JSON.stringify(req.body ?? {}),
    redirect: 'manual',
  });

  if (isLogin) {
    const payload = await response.json() as AuthLoginPayload;
    if (!response.ok) {
      res.status(response.status).json(payload);
      return;
    }

    await regenerateSession(req);
    req.session.accessToken = payload.accessToken;
    req.session.refreshToken = payload.refreshToken;
    res.json({ user: payload.user, expiresIn: payload.expiresIn });
    return;
  }

  const contentType = response.headers.get('content-type');
  const location = response.headers.get('location');
  if (contentType) res.setHeader('content-type', contentType);
  if (location) res.setHeader('location', location);
  res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
}
