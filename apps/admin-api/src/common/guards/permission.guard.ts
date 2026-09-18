import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';

import { UserContext } from '#/common/contexts/user.context';
import { PERMISSIONS_KEY } from '#/common/decorators/permission.decorator';
import { IS_PUBLIC_KEY } from '#/common/decorators/public.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userContext: UserContext,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const user = this.userContext.ensureUser();
    const userPermissions = user.permissions ?? [];

    const hasPermission = requiredPermissions.every((requiredPerm) => {
      if (userPermissions.includes('*')) return true;
      if (userPermissions.includes(requiredPerm)) return true;

      const [resource] = requiredPerm.split(':');
      if (resource && userPermissions.includes(`${resource}:*`)) return true;

      return false;
    });

    if (!hasPermission) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        status: HttpStatus.FORBIDDEN,
      });
    }

    return true;
  }
}
