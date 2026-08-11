import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomBase64Url } from '@pkg/shared/server';
import type { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import { ClsService } from 'nestjs-cls';

import { SESSION_ROLLING_THRESHOLD_SECONDS, SESSION_TTL_SECONDS } from '#/common/constants/app.constants';
import { cookieNames, getCookieOptions } from '#/common/security/cookie.config';
import { SessionStore } from '#/common/security/session.store';
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
      name: cookieNames.session,
      secret: env.APP_SECRET,
      genid: () => randomBase64Url(),
      resave: false,
      saveUninitialized: true,
      rolling: false,
      cookie: getCookieOptions({
        maxAge: SESSION_TTL_SECONDS === -1 ? undefined : SESSION_TTL_SECONDS * 1000,
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
  if (SESSION_TTL_SECONDS <= 0 || !request.session) {
    return;
  }

  const currentMaxAge = request.session.cookie.maxAge;
  const thresholdMs = SESSION_ROLLING_THRESHOLD_SECONDS * 1000;
  if (typeof currentMaxAge !== 'number' || currentMaxAge > thresholdMs) {
    return;
  }

  const ttlMs = SESSION_TTL_SECONDS * 1000;
  request.session.cookie.maxAge = ttlMs;
  response.cookie(cookieNames.session, request.sessionID, {
    ...getCookieOptions({ maxAge: ttlMs }),
    signed: true,
  });
}
