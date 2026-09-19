import { Inject, Injectable, type NestMiddleware } from '@nestjs/common';
import { ApplicationError, randomBase64Url } from '@pkg/shared/common';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import session, { type Store } from 'express-session';

import { SESSION_COOKIE, SESSION_TTL_SECONDS } from '#/config';
import { env } from '#/env';

import { SESSION_STORE } from './session-store.interface';

@Injectable()
export class ExpressSessionMiddleware implements NestMiddleware {
  private readonly middleware: ReturnType<typeof session>;

  constructor(@Inject(SESSION_STORE) store: Store) {
    this.middleware = session({
      store,
      name: SESSION_COOKIE,
      secret: env.APP_SECRET,
      genid: () => randomBase64Url(32),
      proxy: true,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS * 1000 },
    });
  }

  use(request: Request, response: Response, next: NextFunction): void {
    void this.run(this.middleware, request, response).then(() => next(), next);
  }

  private run(middleware: RequestHandler, request: Request, response: Response): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      middleware(request, response, (error?: unknown) => {
        if (error) reject(ApplicationError.from(error, 'SESSION_MIDDLEWARE_FAILED'));
        else resolve();
      });
    });
  }
}
