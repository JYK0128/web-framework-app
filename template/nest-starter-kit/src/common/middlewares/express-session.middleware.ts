import { Injectable, type NestMiddleware } from '@nestjs/common';
import { randomBase64Url } from '@pkg/shared/server';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import session from 'express-session';

import { SESSION_TTL_SECONDS } from '#/common/constants/app.constants';
import { SessionContext } from '#/common/contexts/session.context';
import { toError } from '#/common/helpers/error.helper';
import { getSessionCookieOptions, SESSION_COOKIE } from '#/common/helpers/session-cookie.helper';
import { SessionStore } from '#/common/stores/session.store';
import { env } from '#/env';

@Injectable()
export class ExpressSessionMiddleware implements NestMiddleware {
  private readonly sessionMiddleware: ReturnType<typeof session>;

  constructor(
    store: SessionStore,
    private readonly sessionContext: SessionContext,
  ) {
    this.sessionMiddleware = session({
      store,
      name: SESSION_COOKIE,
      secret: env.APP_SECRET,
      genid: () => randomBase64Url(32),
      proxy: true,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: getSessionCookieOptions({ maxAge: SESSION_TTL_SECONDS * 1000 }),
    });
  }

  use(request: Request, response: Response, next: NextFunction): void {
    void this.initializeRequest(request, response).then(() => next(), next);
  }

  useWebSocket(request: Request, response: Response, next: NextFunction): void {
    void this.initializeSession(request, response).then(() => next(), next);
  }

  private async initializeRequest(request: Request, response: Response): Promise<void> {
    await this.initializeSession(request, response);
    await this.cleanupInvalidSession(request);
  }

  private async initializeSession(request: Request, response: Response): Promise<void> {
    await this.runMiddleware(this.sessionMiddleware, request, response);
  }

  private async cleanupInvalidSession(request: Request): Promise<void> {
    if (!request.session.user && this.hasSessionCookie(request)) {
      await this.sessionContext.destroy();
    }
  }

  private hasSessionCookie(request: Request): boolean {
    return request.headers.cookie
      ?.split(';')
      .some((cookie) => cookie.trim().startsWith(`${SESSION_COOKIE}=`)) === true;
  }

  private async runMiddleware(
    middleware: RequestHandler,
    request: Request,
    response: Response,
  ): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      middleware(request, response, (error?: unknown) => {
        if (!error) {
          resolve();
          return;
        }

        reject(toError(error, 'Middleware failed'));
      });
    });
  }
}
