import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import type { Request, Response } from 'express';

import { SECURITY_CONFIG } from '#/app.config';
import { type AuthenticatedUser, type CreateTokenPairOptions, type IUserAuthService, type RefreshInput, type TokenPairResult } from '#/core/auth/user/user-auth.interface';
import { User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { RequestContext } from '#/core/http/contexts/request.context';
import type { UserPrincipal } from '#/core/http/types/principal.type';

@Injectable()
export class SessionService implements IUserAuthService {
  constructor(private readonly requestContext: RequestContext, private readonly em: AppEntityManager) {}

  async authenticate(_request: Request): Promise<AuthenticatedUser> {
    const sessionPrincipal = this.requestContext.session?.principal;
    if (!sessionPrincipal) throw this.authenticationRequired();

    const user = await this.em.findOne(User, { id: sessionPrincipal.id }, { populate: ['role'] });
    if (!user || user.isDeleted || user.isBanned || user.isLocked || !user.role) throw this.authenticationRequired();

    return {
      user: {
        id: user.id,
        phoneNumberVerified: user.phoneNumberVerified,
        twoFactorSetupRequired: SECURITY_CONFIG.twoFactor.required && !user.twoFactorEnabled,
      },
      principal: { id: user.id, roles: [user.role.code], permissions: user.role.permissions ?? [] },
    };
  }

  async login(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    await this.establishSession(this.toPrincipal(user), options?.rememberMe);
    return {};
  }

  async refresh(_input: RefreshInput): Promise<TokenPairResult> {
    if (!this.requestContext.session?.principal) throw this.authenticationRequired();
    return {};
  }

  async logout(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.session.destroy((error) => {
        if (error) reject(ApplicationError.from(error, 'SESSION_DESTROY_FAILED'));
        else resolve();
      });
    });
    this.response.clearCookie(SECURITY_CONFIG.session.cookieName, { httpOnly: true, sameSite: SECURITY_CONFIG.cookie.sameSite, path: '/' });
  }

  private async establishSession(principal: UserPrincipal, rememberMe = false): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.session.regenerate((error) => {
        if (error) reject(ApplicationError.from(error, 'SESSION_REGENERATE_FAILED'));
        else resolve();
      });
    });
    this.session.principal = principal;
    this.session.cookie.maxAge = rememberMe ? TimeUtil.ms.day(SECURITY_CONFIG.token.rememberMeDays) : TimeUtil.ms.minute(SECURITY_CONFIG.token.refreshIdleTimeoutMinutes);
    await new Promise<void>((resolve, reject) => {
      this.session.save((error) => {
        if (error) reject(ApplicationError.from(error, 'SESSION_SAVE_FAILED'));
        else resolve();
      });
    });
  }

  private toPrincipal(user: User): UserPrincipal {
    return {
      type: 'user',
      id: user.id,
      roles: user.role ? [user.role.code] : [],
      permissions: user.role?.permissions ?? [],
    };
  }

  private authenticationRequired(): ApplicationError {
    return new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
  }

  private get session(): Request['session'] {
    const session = this.requestContext.session;
    if (!session) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: 500 });
    return session;
  }

  private get response(): Response {
    const response = this.requestContext.response;
    if (!response) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: 500 });
    return response;
  }
}
