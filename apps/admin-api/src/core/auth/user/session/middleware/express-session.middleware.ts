import { Inject, Injectable } from '@nestjs/common';
import { ApplicationError, randomBase64Url, TimeUtil } from '@pkg/shared/common';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import session, { type Store } from 'express-session';

import { SECURITY_CONFIG } from '#/app.config';
import { SessionMiddleware } from '#/core/auth/user/session/middleware/session.middleware';
import { SESSION_STORE } from '#/core/auth/user/session/stores/session.store';
import { env } from '#/env';

@Injectable()
export class ExpressSessionMiddleware extends SessionMiddleware {
  private readonly middleware: ReturnType<typeof session>;

  constructor(@Inject(SESSION_STORE) store: Store) {
    super();
    this.middleware = session({
      store,
      name: SECURITY_CONFIG.session.cookieName,
      secret: env.SESSION_SECRET,
      genid: () => randomBase64Url(32),
      proxy: true,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: { httpOnly: true, secure: SECURITY_CONFIG.cookie.secure, sameSite: SECURITY_CONFIG.cookie.sameSite, path: '/', maxAge: TimeUtil.ms.minute(SECURITY_CONFIG.token.refreshIdleTimeoutMinutes) },
    });
  }

  override use(request: unknown, response: unknown, next: (error?: unknown) => void): void {
    void this.run(this.middleware, request as Request, response as Response).then(() => next(), next);
  }

  useWebSocket(request: Request, response: Response, next: NextFunction): void {
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
