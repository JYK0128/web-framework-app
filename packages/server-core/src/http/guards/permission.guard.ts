import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';

import { PrincipalContext } from '#http/contexts/principal.context';
import { PERMISSIONS_KEY } from '#http/decorators/permission.decorator';
import type { AuthPrincipal } from '#http/types/principal.type';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly principalContext: PrincipalContext,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const user: Extract<AuthPrincipal, { type: 'user' }> | undefined = context.getType() === 'ws'
      ? context.switchToWs().getClient<{ data: { principal?: AuthPrincipal } }>().data.principal as Extract<AuthPrincipal, { type: 'user' }> | undefined
      : this.principalContext.ensureUser();
    if (!user || user.type !== 'user') {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    const userPermissions = user.permissions;
    const hasPermission = requiredPermissions.every((requiredPerm) => userPermissions.includes(requiredPerm));

    if (!hasPermission) {
      throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN });
    }
    return true;
  }
}
