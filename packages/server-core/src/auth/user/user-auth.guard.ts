import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

import { type IUserAuthService, USER_AUTH_POLICY_OPTIONS, USER_AUTH_SERVICE, type UserAuthPolicyOptions } from '#auth/user/user-auth.interface';
import { PrincipalContext } from '#http/contexts/principal.context';
import { SKIP_PASSWORD_EXPIRY_KEY, SKIP_PHONE_VERIFICATION_KEY, SKIP_TWO_FACTOR_SETUP_KEY } from '#http/decorators/auth-mode.decorator';
import type { AuthPrincipal } from '#http/types/principal.type';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly principalContext: PrincipalContext,
    private readonly reflector: Reflector,
    @Inject(USER_AUTH_SERVICE) private readonly authService: IUserAuthService,
    @Inject(USER_AUTH_POLICY_OPTIONS) private readonly policy: UserAuthPolicyOptions,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const skipPasswordExpiry = this.reflector.getAllAndOverride<boolean>(SKIP_PASSWORD_EXPIRY_KEY, targets) === true;
    const skipPhoneVerification = this.reflector.getAllAndOverride<boolean>(SKIP_PHONE_VERIFICATION_KEY, targets) === true;
    const skipTwoFactorSetup = this.reflector.getAllAndOverride<boolean>(SKIP_TWO_FACTOR_SETUP_KEY, targets) === true;
    const socket = context.getType() === 'ws'
      ? context.switchToWs().getClient<{ request: Request, data: { principal?: AuthPrincipal } }>()
      : undefined;
    const request = socket ? socket.request : context.switchToHttp().getRequest<Request>();
    const authenticated = await this.authService.authenticate(request);
    enforcePolicy(authenticated, this.policy, { skipPasswordExpiry, skipPhoneVerification, skipTwoFactorSetup });
    if (socket) {
      socket.data.principal = authenticated;
    }
    else {
      this.principalContext.setUser(authenticated);
    }
    return true;
  }
}

function enforcePolicy(user: Extract<AuthPrincipal, { type: 'user' }>, policy: UserAuthPolicyOptions, skip: { skipPasswordExpiry: boolean, skipPhoneVerification: boolean, skipTwoFactorSetup: boolean }): void {
  if (policy.requirePhoneNumberVerification && !user.phoneNumberVerified && !skip.skipPhoneVerification) {
    throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_REQUIRED', status: HttpStatus.FORBIDDEN });
  }
  if (user.twoFactorSetupRequired && !skip.skipTwoFactorSetup) {
    throw new ApplicationError({ code: 'TWO_FACTOR_SETUP_REQUIRED', status: HttpStatus.FORBIDDEN });
  }
  if (!skip.skipPasswordExpiry && policy.passwordExpirationDays > 0 && user.passwordExpiresAt !== null && Date.now() >= user.passwordExpiresAt) {
    throw new ApplicationError({ code: 'PASSWORD_EXPIRED', status: HttpStatus.FORBIDDEN });
  }
}
