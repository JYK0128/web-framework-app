import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';
import { jwtVerify } from 'jose';

import { SECURITY_CONFIG, SERVICE_ID } from '#/app.config';
import { PrincipalContext } from '#/common/contexts/principal.context';
import { RequestContext } from '#/common/contexts/request.context';
import { ALLOW_PASSWORD_EXPIRED_KEY, ALLOW_TWO_FACTOR_ENROLLMENT_KEY, ALLOW_UNVERIFIED_IDENTITY_KEY } from '#/common/decorators/auth-mode.decorator';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { isCredentialPasswordExpired } from '#/modules/auth/password-policy';

import { TOKEN_STORE, type TokenStore } from './jwt/token.store';
import { getTokenSessionTtls } from './jwt/token-session-ttl';
import { UserTokenClaimsSchema } from './jwt/user-token-claims';
import { USER_AUTH_DRIVER, type UserAuthDriver } from './user-auth.interface';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly principalContext: PrincipalContext,
    private readonly requestContext: RequestContext,
    private readonly em: AppEntityManager,
    private readonly reflector: Reflector,
    @Inject(USER_AUTH_DRIVER) private readonly driver: UserAuthDriver,
    @Optional() @Inject(TOKEN_STORE) private readonly tokenStore?: TokenStore,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const allowPasswordExpired = this.reflector.getAllAndOverride<boolean>(ALLOW_PASSWORD_EXPIRED_KEY, [context.getHandler(), context.getClass()]) === true;
    const allowUnverifiedIdentity = this.reflector.getAllAndOverride<boolean>(ALLOW_UNVERIFIED_IDENTITY_KEY, [context.getHandler(), context.getClass()]) === true;
    const allowTwoFactorEnrollment = this.reflector.getAllAndOverride<boolean>(ALLOW_TWO_FACTOR_ENROLLMENT_KEY, [context.getHandler(), context.getClass()]) === true;

    if (this.driver === 'session') {
      const principal = this.requestContext.session?.principal;
      if (!principal) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
      const user = await this.em.findOne(User, { id: principal.id }, { populate: ['role'] });
      if (!user || user.isDeleted || user.isBanned || user.isLocked || !user.role) {
        throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
      }
      assertIdentityVerificationAccess(user.phoneNumberVerified, allowUnverifiedIdentity);
      assertTwoFactorEnrollmentAccess(user.twoFactorEnabled, allowTwoFactorEnrollment);
      await this.assertPasswordNotExpired(user.id, allowPasswordExpired);
      this.principalContext.setUser({ id: user.id, roles: [user.role.code], permissions: user.role.permissions ?? [] });
      return true;
    }
    const token = (request.header('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    let payload: ReturnType<typeof UserTokenClaimsSchema.parse>;
    try {
      const result = await jwtVerify(token, new TextEncoder().encode(env.APP_JWT_SECRET), {
        issuer: SERVICE_ID, audience: SERVICE_ID, algorithms: ['HS256'],
      });
      payload = UserTokenClaimsSchema.parse(result.payload);
    }
    catch {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    const user = await this.em.findOne(User, { id: payload.sub });
    if (!user || user.isDeleted || user.isBanned || user.isLocked) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    assertIdentityVerificationAccess(user.phoneNumberVerified, allowUnverifiedIdentity);
    assertTwoFactorEnrollmentAccess(user.twoFactorEnabled, allowTwoFactorEnrollment);
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
      throw new ApplicationError({ code: 'PASSWORD_EXPIRED', status: HttpStatus.FORBIDDEN, message: '비밀번호가 만료됐습니다. 비밀번호 재설정 후 다시 로그인해 주세요.' });
    }
  }
}

function assertIdentityVerificationAccess(identityVerified: boolean, allowUnverifiedIdentity: boolean): void {
  if (SECURITY_CONFIG.registration.requireIdentityVerification && !identityVerified && !allowUnverifiedIdentity) {
    throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_REQUIRED', status: HttpStatus.FORBIDDEN, message: '계속하려면 먼저 본인인증을 완료해 주세요.' });
  }
}

function assertTwoFactorEnrollmentAccess(twoFactorEnabled: boolean, allowEnrollment: boolean): void {
  if (SECURITY_CONFIG.twoFactor.required && !twoFactorEnabled && !allowEnrollment) {
    throw new ApplicationError({ code: 'TWO_FACTOR_SETUP_REQUIRED', status: HttpStatus.FORBIDDEN, message: '계속하려면 먼저 2단계 인증을 설정해 주세요.' });
  }
}
