import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

import { SECURITY_CONFIG } from '#/app.config';
import { isCredentialPasswordExpired } from '#/core/auth/user/policy/password.policy';
import { type IUserAuthService, USER_AUTH_SERVICE } from '#/core/auth/user/user-auth.interface';
import { Account } from '#/core/database/entities/auth/account.entity';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { SKIP_PASSWORD_EXPIRY_KEY, SKIP_PHONE_VERIFICATION_KEY, SKIP_TWO_FACTOR_SETUP_KEY } from '#/core/http/decorators/auth-mode.decorator';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly principalContext: PrincipalContext,
    private readonly em: AppEntityManager,
    private readonly reflector: Reflector,
    @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipPasswordExpiry = this.reflector.getAllAndOverride<boolean>(SKIP_PASSWORD_EXPIRY_KEY, [context.getHandler(), context.getClass()]) === true;
    const skipPhoneVerification = this.reflector.getAllAndOverride<boolean>(SKIP_PHONE_VERIFICATION_KEY, [context.getHandler(), context.getClass()]) === true;
    const skipTwoFactorSetup = this.reflector.getAllAndOverride<boolean>(SKIP_TWO_FACTOR_SETUP_KEY, [context.getHandler(), context.getClass()]) === true;
    const request = context.switchToHttp().getRequest<Request>();
    const { user, principal, passwordExpiresAt } = await this.userAuthService.authenticate(request);

    assertPhoneNumberVerificationAccess(user.phoneNumberVerified, skipPhoneVerification);
    assertTwoFactorSetupAccess(user.twoFactorSetupRequired, skipTwoFactorSetup);
    await this.assertPasswordNotExpired(user.id, skipPasswordExpiry, passwordExpiresAt);
    this.principalContext.setUser(principal);
    return true;
  }

  private async assertPasswordNotExpired(userId: string, skipPasswordExpiry: boolean, passwordExpiresAt?: number | null): Promise<void> {
    if (skipPasswordExpiry || SECURITY_CONFIG.password.expirationDays <= 0) return;
    if (passwordExpiresAt !== undefined) {
      if (passwordExpiresAt !== null && Date.now() >= passwordExpiresAt) {
        throw new ApplicationError({ code: 'PASSWORD_EXPIRED', status: HttpStatus.FORBIDDEN });
      }
      return;
    }

    const account = await this.em.findOne(Account, { user: userId, providerId: Account.PROVIDER_CREDENTIAL });
    if (account?.password && isCredentialPasswordExpired(account)) {
      throw new ApplicationError({ code: 'PASSWORD_EXPIRED', status: HttpStatus.FORBIDDEN });
    }
  }
}

function assertPhoneNumberVerificationAccess(identityVerified: boolean, skipPhoneVerification: boolean): void {
  if (SECURITY_CONFIG.registration.requirePhoneNumberVerification && !identityVerified && !skipPhoneVerification) {
    throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_REQUIRED', status: HttpStatus.FORBIDDEN });
  }
}

function assertTwoFactorSetupAccess(twoFactorSetupRequired: boolean, skipTwoFactorSetup: boolean): void {
  if (twoFactorSetupRequired && !skipTwoFactorSetup) {
    throw new ApplicationError({ code: 'TWO_FACTOR_SETUP_REQUIRED', status: HttpStatus.FORBIDDEN });
  }
}
