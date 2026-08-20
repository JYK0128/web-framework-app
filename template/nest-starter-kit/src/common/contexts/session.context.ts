import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AuthPrincipal } from 'express-session';

import { toError } from '#/common/helpers/error.helper';
import { getSessionCookieOptions, SESSION_COOKIE } from '#/common/helpers/session-cookie.helper';

import { RequestContext } from './request.context';

@Injectable()
export class SessionContext {
  constructor(
    private readonly requestContext: RequestContext,
  ) {}

  async establish(principal: AuthPrincipal): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.request.session.regenerate((error) => {
        if (error) reject(toError(error, 'Failed to regenerate session'));
        else resolve();
      });
    });
    this.request.session.user = principal;
    await new Promise<void>((resolve, reject) => {
      this.request.session.save((error) => {
        if (error) reject(toError(error, 'Failed to save session'));
        else resolve();
      });
    });
  }

  async destroy(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.request.session.destroy((error) => {
        if (error) reject(toError(error, 'Failed to destroy session'));
        else resolve();
      });
    });
    this.response.clearCookie(SESSION_COOKIE, getSessionCookieOptions());
  }

  private get request(): Request {
    const request = this.requestContext.request;
    if (!request) throw new Error('No HTTP request is bound to the current execution context');
    return request;
  }

  private get response(): Response {
    const response = this.request.res;
    if (!response) throw new Error('No HTTP response is bound to the current request context');
    return response;
  }
}
