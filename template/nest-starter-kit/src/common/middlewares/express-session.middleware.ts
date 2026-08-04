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
      secret: env.SESSION_SECRET,
      genid: () => randomBytes(32).toString('base64url'),
      resave: false,
      saveUninitialized: true,
      cookie: getCookieOptions({
        maxAge: env.SESSION_TTL_SECONDS * 1000,
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
      void this.store.ensureAnonymousSession(request.sessionID).then(
        () => next(),
        (ensureError: unknown) => next(ensureError),
      );
    });
  }
}
