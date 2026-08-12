import { EntityManager } from '@mikro-orm/core';
import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { PERMISSION_KEY, type PermissionName } from '#/common/decorators/permission.decorator';
import { Role, type SystemRoleName } from '#/entities/auth/role.entity';

const PERMISSION_EXCLUDED_CONTROLLERS = new Set(['auth', 'health']);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isExcludedController(context)) return true;

    const permissions = this.reflector.getAllAndOverride<PermissionName[]>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permissions?.length) {
      throw new ApplicationError({
        code: 'PERMISSION_METADATA_REQUIRED',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }

    const user = this.cls.get('user');
    if (!user?.role) {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    const role = await this.em.findOne(Role, { name: user.role as SystemRoleName });

    if (!role || !this.hasPermissions(role.permissions, permissions)) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        status: HttpStatus.FORBIDDEN,
      });
    }

    return true;
  }

  private isExcludedController(context: ExecutionContext): boolean {
    const metadata = this.reflector.get<string | string[]>('path', context.getClass());
    const paths = Array.isArray(metadata) ? metadata : [metadata];

    return paths.some((path) => {
      if (typeof path !== 'string') return false;
      const controllerPath = path.split('/').find((segment) => segment.length > 0);
      if (!controllerPath) return false;
      return PERMISSION_EXCLUDED_CONTROLLERS.has(controllerPath);
    });
  }

  private hasPermissions(
    rolePermissions: Record<string, string[]>,
    requiredPermissions: PermissionName[],
  ): boolean {
    return requiredPermissions.every((permission) => {
      const separatorIndex = permission.indexOf(':');
      if (separatorIndex <= 0 || separatorIndex === permission.length - 1) return false;

      const resource = permission.slice(0, separatorIndex);
      const action = permission.slice(separatorIndex + 1);
      return rolePermissions[resource]?.includes(action) === true;
    });
  }
}
