import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';

import { MachineAuthGuard } from '#/core/auth/machine/machine-auth.guard';
import { UserAuthGuard } from '#/core/auth/user/user-auth.guard';
import { AUTH_MODE_KEY, type AuthMode } from '#/core/http/decorators/auth-mode.decorator';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userAuthGuard: UserAuthGuard,
    private readonly machineAuthGuard: MachineAuthGuard,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const mode = this.reflector.getAllAndOverride<AuthMode>(AUTH_MODE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (mode === 'public') return true;
    if (mode === 'user') return this.userAuthGuard.canActivate(context);
    if (mode === 'machine') return this.machineAuthGuard.canActivate(context);

    throw new ApplicationError({
      code: 'AUTHENTICATION_MODE_NOT_CONFIGURED',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
