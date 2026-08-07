import { randomBytes } from 'node:crypto';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import { ClsService } from 'nestjs-cls';

import { getCookieOptions } from '#/common/session/cookie.config';
import { SessionStore } from '#/common/session/session.store';
import { env } from '#/env';

@Injectable()
export class ExpressSessionMiddleware implements NestMiddleware {
  private readonly middleware: ReturnType<typeof session>;

  constructor(
    private readonly store: SessionStore,
    private readonly cls: ClsService,
  ) {
    this.middleware = session({
      store,
      name: env.COOKIE_NAME,
      secret: env.APP_SECRET,
      genid: () => randomBytes(32).toString('base64url'),
      resave: false,
      saveUninitialized: true,
      rolling: false,
      cookie: getCookieOptions({
        maxAge: env.SESSION_TTL_SECONDS === -1 ? undefined : env.SESSION_TTL_SECONDS * 1000,
      }),
    });
  }

  use(request: Request, response: Response, next: NextFunction): void {
    this.middleware(request, response, (error?: unknown) => {
      if (error) {
        next(error);
        return;
      }

      if (this.cls.isActive()) this.cls.set('sessionId', request.sessionID);
      refreshSessionCookie(request, response);

      void this.store.ensureAnonymousSession(request.sessionID).then(
        () => next(),
        (ensureError: unknown) => next(ensureError),
      );
    });
  }
}

function refreshSessionCookie(request: Request, response: Response): void {
  if (env.SESSION_TTL_SECONDS <= 0 || !request.session) {
    return;
  }

  const currentMaxAge = request.session.cookie.maxAge;
  const thresholdMs = env.SESSION_ROLLING_THRESHOLD_SECONDS * 1000;
  if (typeof currentMaxAge !== 'number' || currentMaxAge > thresholdMs) {
    return;
  }

  const ttlMs = env.SESSION_TTL_SECONDS * 1000;
  request.session.cookie.maxAge = ttlMs;
  response.cookie(env.COOKIE_NAME, request.sessionID, {
    ...getCookieOptions({ maxAge: ttlMs }),
    signed: true,
  });
}
