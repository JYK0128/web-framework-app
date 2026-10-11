import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

import { SECURITY_CONFIG } from '#/app.config';
import { TOKEN_STORE, type TokenStore } from '#/core/auth/user/adapters/jwt/token.store';
import { getTokenSessionTtls } from '#/core/auth/user/adapters/jwt/token-session-ttl';
import { UserJwtAdapter } from '#/core/auth/user/adapters/jwt/user-jwt.adapter';
import { UserTokenClaimsSchema } from '#/core/auth/user/adapters/jwt/user-token-claims';
import { isCredentialPasswordExpired } from '#/core/auth/user/password-policy';
import { USER_AUTH_DRIVER, type UserAuthDriver } from '#/core/auth/user/user-auth.interface';
import { Account } from '#/core/database/entities/auth/account.entity';
import { User } from '#/core/database/entities/auth/user.entity';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { RequestContext } from '#/core/http/contexts/request.context';
import { ALLOW_PASSWORD_EXPIRED_KEY, ALLOW_UNCONFIGURED_TWO_FACTOR_KEY, ALLOW_UNVERIFIED_PHONE_NUMBER_KEY } from '#/core/http/decorators/auth-mode.decorator';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly principalContext: PrincipalContext,
    private readonly requestContext: RequestContext,
    private readonly em: AppEntityManager,
    private readonly reflector: Reflector,
    private readonly jwt: UserJwtAdapter,
    @Inject(USER_AUTH_DRIVER) private readonly driver: UserAuthDriver,
    @Optional() @Inject(TOKEN_STORE) private readonly tokenStore?: TokenStore,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const allowPasswordExpired = this.reflector.getAllAndOverride<boolean>(ALLOW_PASSWORD_EXPIRED_KEY, [context.getHandler(), context.getClass()]) === true;
    const allowUnverifiedPhoneNumber = this.reflector.getAllAndOverride<boolean>(ALLOW_UNVERIFIED_PHONE_NUMBER_KEY, [context.getHandler(), context.getClass()]) === true;
    const allowUnconfiguredTwoFactor = this.reflector.getAllAndOverride<boolean>(ALLOW_UNCONFIGURED_TWO_FACTOR_KEY, [context.getHandler(), context.getClass()]) === true;

    if (this.driver === 'session') {
      const principal = this.requestContext.session?.principal;
      if (!principal) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
      const user = await this.em.findOne(User, { id: principal.id }, { populate: ['role'] });
      if (!user || user.isDeleted || user.isBanned || user.isLocked || !user.role) {
        throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
      }
      assertPhoneNumberVerificationAccess(user.phoneNumberVerified, allowUnverifiedPhoneNumber);
      assertTwoFactorEnrollmentAccess(user.twoFactorEnabled, allowUnconfiguredTwoFactor);
      await this.assertPasswordNotExpired(user.id, allowPasswordExpired);
      this.principalContext.setUser({ id: user.id, roles: [user.role.code], permissions: user.role.permissions ?? [] });
      return true;
    }
    const token = (request.header('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    let payload: ReturnType<typeof UserTokenClaimsSchema.parse>;
    try {
      payload = await this.jwt.verify(token);
    }
    catch {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    const user = await this.em.findOne(User, { id: payload.sub });
    if (!user || user.isDeleted || user.isBanned || user.isLocked) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    assertPhoneNumberVerificationAccess(user.phoneNumberVerified, allowUnverifiedPhoneNumber);
    assertTwoFactorEnrollmentAccess(user.twoFactorEnabled, allowUnconfiguredTwoFactor);
    await this.assertPasswordNotExpired(user.id, allowPasswordExpired);
    if (payload.sid) {
      const { sessionTtlSeconds } = getTokenSessionTtls(payload.rememberMe === true);
      if (!this.tokenStore || !await this.tokenStore.touchFamily(payload.sid, sessionTtlSeconds)) {
        throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
      }
    }
    this.principalContext.setUser({ id: payload.sub, roles: payload.roles, permissions: payload.permissions });
    return true;
  }

  private async assertPasswordNotExpired(userId: string, allowPasswordExpired: boolean): Promise<void> {
    if (allowPasswordExpired || SECURITY_CONFIG.password.expirationDays <= 0) return;
    const account = await this.em.findOne(Account, { user: userId, providerId: Account.PROVIDER_CREDENTIAL });
    if (account?.password && isCredentialPasswordExpired(account)) {
      throw new ApplicationError({ code: 'PASSWORD_EXPIRED', status: HttpStatus.FORBIDDEN });
    }
  }
}

function assertPhoneNumberVerificationAccess(identityVerified: boolean, allowUnverifiedPhoneNumber: boolean): void {
  if (SECURITY_CONFIG.registration.requirePhoneNumberVerification && !identityVerified && !allowUnverifiedPhoneNumber) {
    throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_REQUIRED', status: HttpStatus.FORBIDDEN });
  }
}

function assertTwoFactorEnrollmentAccess(twoFactorEnabled: boolean, allowEnrollment: boolean): void {
  if (SECURITY_CONFIG.twoFactor.required && !twoFactorEnabled && !allowEnrollment) {
    throw new ApplicationError({ code: 'TWO_FACTOR_SETUP_REQUIRED', status: HttpStatus.FORBIDDEN });
  }
}
