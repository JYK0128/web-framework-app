import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { BYPASS_KEY, BypassPolicy, type BypassPolicy as BypassPolicyType } from '#/common/decorators/bypass.decorator';
import { PERMISSION_KEY, type PermissionName } from '#/common/decorators/permission.decorator';
import { IS_PUBLIC_KEY } from '#/common/decorators/public.decorator';
import { AuthPermissionService } from '#/common/security/auth-permission.service';
import type { RolePermissions } from '#/entities/auth.extentions/role.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
    private readonly authPermissionService: AuthPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const bypassPolicies = this.reflector.getAllAndOverride<BypassPolicyType[]>(BYPASS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];
    if (bypassPolicies.includes(BypassPolicy.PERMISSION)) return true;

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

    const rolePermissions = await this.authPermissionService.getPermissions(user.role);

    if (!this.hasPermissions(rolePermissions, permissions)) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        status: HttpStatus.FORBIDDEN,
      });
    }

    return true;
  }

  private hasPermissions(
    rolePermissions: RolePermissions,
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
