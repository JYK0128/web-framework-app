import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';
import { ClsService } from 'nestjs-cls';

import { Policy, PROTECTED_KEY, type ProtectionPolicy } from '#/common/decorators/protected.decorator';
import { IS_PUBLIC_KEY } from '#/common/decorators/public.decorator';

function isKnownPolicy(policy: unknown): policy is ProtectionPolicy {
  return Object.values(Policy).includes(policy as ProtectionPolicy);
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policies = this.reflector.getAllAndOverride<ProtectionPolicy[]>(PROTECTED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const required = policies.length > 0 || isPublic
      ? policies
      : [Policy.SESSION];

    if (!required.every(isKnownPolicy)) return false;

    if (required.includes(Policy.SESSION)) {
      this.assertSession();
    }

    if (required.includes(Policy.TWO_FACTOR)) {
      this.assertTwoFactor(context);
    }

    return true;
  }

  private assertSession(): void {
    const user = this.cls.get('user');
    if (!user || user.isAnonymous) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
  }

  private assertTwoFactor(context: ExecutionContext): void {
    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as Record<string, unknown> | undefined;
    const token = cookies?.two_factor;

    if (typeof token !== 'string' || token.trim().length === 0) {
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });
    }
  }
}
