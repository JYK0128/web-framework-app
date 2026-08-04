import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';

import { IS_PUBLIC_KEY } from '#/common/decorators/public.decorator';

export const SKIP_2FA_KEY = 'skip_2fa';

@Injectable()
export class TwoFactorAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skip2FA = this.reflector.getAllAndOverride<boolean>(SKIP_2FA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip2FA) return true;

    const user = this.cls.get('user');
    if (!user) return true; // Let AuthGuard handle unauthenticated users

    // If user has 2FA enabled but is not authenticated with it, block access
    if (user.isTwoFactorAuthEnabled && !this.cls.get('isTwoFactorAuthenticated')) {
      throw new ForbiddenException({
        code: 'TWO_FACTOR_AUTH_REQUIRED',
        message: 'Two-factor authentication is required',
      });
    }

    return true;
  }
}
