import { ApplicationError } from '@pkg/shared/common';
import { RedisStore } from 'connect-redis';
import type { Request } from 'express';
import session from 'express-session';

import { sessionCookieName } from '~/config/cookie';
import { env } from '~/config/env';
import { redisClient } from '~/config/redis';

declare module 'express-session' {
  interface SessionData {
    accessToken?: string
    refreshToken?: string
  }
}

const sessionStore = new RedisStore({
  client: redisClient,
  prefix: 'service-web:session:',
  ttl: env.SESSION_TTL_SECONDS,
});

export const sessionMiddleware = session({
  store: sessionStore,
  name: sessionCookieName,
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    maxAge: env.SESSION_TTL_SECONDS * 1000,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  },
});

export function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error)
        reject(ApplicationError.from(error, 'SESSION_REGENERATE_FAILED'));
      else resolve();
    });
  });
}
