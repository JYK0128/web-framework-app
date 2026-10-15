import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import type { Request, Response } from 'express';

import { getCredentialPasswordExpiresAt } from '#auth/user/credential-password';
import { AUTH_READER, type AuthAccount, type AuthReader, type AuthUser, type CreateTokenPairOptions, type IUserAuthService, type RefreshInput, type TokenPairResult, USER_AUTH_POLICY_OPTIONS, USER_SESSION_OPTIONS, type UserAuthPolicyOptions, type UserSessionOptions } from '#auth/user/user-auth.interface';
import { RequestContext } from '#http/contexts/request.context';
import type { AuthPrincipal } from '#http/types/principal.type';

@Injectable()
export class SessionService implements IUserAuthService {
  constructor(
    private readonly requestContext: RequestContext,
    @Inject(AUTH_READER) private readonly reader: AuthReader,
    @Inject(USER_AUTH_POLICY_OPTIONS) private readonly policy: UserAuthPolicyOptions,
    @Inject(USER_SESSION_OPTIONS) private readonly options: UserSessionOptions,
  ) {}

  async authenticate(_request: Request): Promise<Extract<AuthPrincipal, { type: 'user' }>> {
    const id = this.requestContext.session?.userId;
    if (!id) throw authenticationRequired();
    const user = await this.reader.findUserById(id);
    if (!user || user.isDeleted || user.isBanned || user.isLocked || !user.role) throw authenticationRequired();
    const account = this.policy.passwordExpirationDays > 0 ? await this.reader.findCredentialAccount(user.id) : null;
    return this.toPrincipal(user, account);
  }

  async login(user: AuthUser, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    if (!user.role) throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN });
    await this.establishSession(user.id, options?.rememberMe);
    return {};
  }

  async refresh(_input: RefreshInput): Promise<TokenPairResult> {
    if (!this.requestContext.session?.userId) throw authenticationRequired();
    return {};
  }

  async logout(): Promise<void> {
    await new Promise<void>((resolve, reject) => this.session.destroy((error) => error ? reject(ApplicationError.from(error, 'SESSION_DESTROY_FAILED')) : resolve()));
    this.response.clearCookie(this.options.cookieName, { httpOnly: true, sameSite: this.options.cookieSameSite, path: '/' });
  }

  private async establishSession(userId: string, rememberMe = false): Promise<void> {
    await new Promise<void>((resolve, reject) => this.session.regenerate((error) => error ? reject(ApplicationError.from(error, 'SESSION_REGENERATE_FAILED')) : resolve()));
    this.session.userId = userId;
    this.session.cookie.maxAge = rememberMe ? TimeUtil.ms.day(this.options.rememberMeDays) : TimeUtil.ms.minute(this.options.refreshIdleTimeoutMinutes);
    await new Promise<void>((resolve, reject) => this.session.save((error) => error ? reject(ApplicationError.from(error, 'SESSION_SAVE_FAILED')) : resolve()));
  }

  private toPrincipal(user: AuthUser, account: AuthAccount | null): Extract<AuthPrincipal, { type: 'user' }> {
    if (!user.role) throw authenticationRequired();
    return {
      type: 'user',
      id: user.id,
      roles: [user.role.code],
      permissions: user.role.permissions,
      phoneNumberVerified: user.phoneNumberVerified,
      twoFactorSetupRequired: this.policy.twoFactorRequired && !user.twoFactorEnabled,
      passwordExpiresAt: account?.password ? getCredentialPasswordExpiresAt(account, { expirationDays: this.policy.passwordExpirationDays, changeDeferDays: this.policy.passwordChangeDeferDays }) : null,
    };
  }

  private get session(): Request['session'] {
    const value = this.requestContext.session;
    if (!value) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
    return value;
  }

  private get response(): Response {
    const value = this.requestContext.response;
    if (!value) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
    return value;
  }
}

function authenticationRequired(): ApplicationError {
  return new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
}
