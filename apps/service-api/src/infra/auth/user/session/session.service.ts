import { Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import type { Request, Response } from 'express';

import { RequestContext } from '#/common/contexts/request.context';
import type { UserPrincipal } from '#/common/types/principal.type';
import { SECURITY_CONFIG } from '#/config';

@Injectable()
export class SessionService {
  constructor(private readonly requestContext: RequestContext) {}

  async establish(principal: UserPrincipal, options?: { rememberMe?: boolean }): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.session.regenerate((error) => {
        if (error) reject(ApplicationError.from(error, 'SESSION_REGENERATE_FAILED'));
        else resolve();
      });
    });
    this.session.principal = principal;
    this.session.cookie.maxAge = options?.rememberMe ? TimeUtil.ms.day(SECURITY_CONFIG.token.rememberMeDays) : TimeUtil.ms.minute(SECURITY_CONFIG.token.refreshIdleTimeoutMinutes);
    await new Promise<void>((resolve, reject) => {
      this.session.save((error) => {
        if (error) reject(ApplicationError.from(error, 'SESSION_SAVE_FAILED'));
        else resolve();
      });
    });
  }

  async destroy(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.session.destroy((error) => {
        if (error) reject(ApplicationError.from(error, 'SESSION_DESTROY_FAILED'));
        else resolve();
      });
    });
    this.response.clearCookie(SECURITY_CONFIG.session.cookieName, { httpOnly: true, sameSite: SECURITY_CONFIG.cookie.sameSite, path: '/' });
  }

  isAuthenticated(): boolean {
    return Boolean(this.requestContext.session?.principal);
  }

  private get session(): Request['session'] {
    const session = this.requestContext.session;
    if (!session) throw new Error('No HTTP session is bound to the current execution context');
    return session;
  }

  private get response(): Response {
    const response = this.requestContext.response;
    if (!response) throw new Error('No HTTP response is bound to the current request context');
    return response;
  }
}
