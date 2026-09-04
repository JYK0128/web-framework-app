import { Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request, Response } from 'express';
import type { AuthPrincipal } from 'express-session';

import { SESSION_REMEMBER_ME_TTL_SECONDS, SESSION_TTL_SECONDS } from '#/common/configs/app.config';
import { getSessionCookieOptions, SESSION_COOKIE } from '#/common/configs/session.config';

import { RequestContext } from './request.context';

@Injectable()
export class SessionContext {
  constructor(
    private readonly requestContext: RequestContext,
  ) {}

  async establish(principal: AuthPrincipal, options?: { rememberMe?: boolean }): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.request.session.regenerate((error) => {
        if (error) reject(ApplicationError.from(error, 'SESSION_REGENERATE_FAILED'));
        else resolve();
      });
    });
    this.request.session.user = principal;
    if (options?.rememberMe) {
      this.request.session.cookie.maxAge = SESSION_REMEMBER_ME_TTL_SECONDS * 1000;
    }
    else {
      this.request.session.cookie.maxAge = SESSION_TTL_SECONDS * 1000;
    }
    await new Promise<void>((resolve, reject) => {
      this.request.session.save((error) => {
        if (error) reject(ApplicationError.from(error, 'SESSION_SAVE_FAILED'));
        else resolve();
      });
    });
  }

  async destroy(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.request.session.destroy((error) => {
        if (error) reject(ApplicationError.from(error, 'SESSION_DESTROY_FAILED'));
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
