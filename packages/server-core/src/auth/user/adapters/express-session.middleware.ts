import { Inject, Injectable } from '@nestjs/common';
import { SessionMiddleware } from '@pkg/server-core/auth/user/session/session.interface';
import { SessionStore } from '@pkg/server-core/auth/user/session/session.store';
import { USER_SESSION_OPTIONS, type UserSessionOptions } from '@pkg/server-core/auth/user/user-auth.interface';
import { ApplicationError, randomBase64Url, TimeUtil } from '@pkg/shared/common';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import session from 'express-session';

@Injectable()
export class ExpressSessionMiddleware extends SessionMiddleware {
  private readonly middleware: ReturnType<typeof session>;
  constructor(store: SessionStore, @Inject(USER_SESSION_OPTIONS) options: UserSessionOptions) {
    super();
    this.middleware = session({
      store,
      name: options.cookieName,
      secret: options.sessionSecret,
      genid: () => randomBase64Url(32),
      proxy: true,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: { httpOnly: true, secure: options.cookieSecure, sameSite: options.cookieSameSite, path: '/', maxAge: TimeUtil.ms.minute(options.refreshIdleTimeoutMinutes) },
    });
  }

  override use(request: unknown, response: unknown, next: (error?: unknown) => void): void {
    void this.run(this.middleware, request as Request, response as Response).then(() => next(), next);
  }

  useWebSocket(request: Request, response: Response, next: NextFunction): void {
    void this.run(this.middleware, request, response).then(() => next(), next);
  }

  private run(middleware: RequestHandler, request: Request, response: Response): Promise<void> {
    return new Promise<void>((resolve, reject) => middleware(request, response, (error?: unknown) => {
      if (error) reject(ApplicationError.from(error, 'SESSION_MIDDLEWARE_FAILED'));
      else resolve();
    }));
  }
}
