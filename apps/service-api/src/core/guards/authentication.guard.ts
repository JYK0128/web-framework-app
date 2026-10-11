import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';

import { AUTH_MODE_KEY, type AuthMode } from '#/core/decorators/auth-mode.decorator';
import { UserAuthGuard } from '#/core/guards/user-auth.guard';
import { MachineAuthGuard } from '#/infra/auth/machine/machine-auth.guard';

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
