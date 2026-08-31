import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

import { BYPASS_KEY, BypassPolicy, type BypassPolicy as BypassPolicyType } from '#/common/decorators/bypass.decorator';
import { IS_PUBLIC_KEY } from '#/common/decorators/public.decorator';

@Injectable()
export class EmailVerificationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const bypassPolicies = this.reflector.getAllAndOverride<BypassPolicyType[]>(BYPASS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];
    if (bypassPolicies.includes(BypassPolicy.EMAIL_VERIFICATION)) return true;

    const user = context.switchToHttp().getRequest<Request>().session.user;
    if (!user) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    if (user.email.trim() && user.emailVerified) return true;

    throw new ApplicationError({
      code: 'EMAIL_VERIFICATION_REQUIRED',
      status: HttpStatus.FORBIDDEN,
    });
  }
}
