import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { PERMISSIONS_KEY } from '#/common/decorators/permission.decorator';

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

    const user = this.principalContext.ensureUser();
    const userPermissions = user.permissions;
    const hasPermission = requiredPermissions.every((requiredPerm) => userPermissions.includes(requiredPerm));

    if (!hasPermission) {
      throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN });
    }
    return true;
  }
}
