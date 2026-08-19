import { Injectable } from '@nestjs/common';

import { RedisService } from '#/common/redis/redis.service';
import { AppEntityManager } from '#/database/entity-manager';
import { Role, type RoleName, type RolePermissions } from '#/entities/auth.extentions/role.entity';

const ROLE_PERMISSION_TTL_SECONDS = 60 * 60;

@Injectable()
export class AuthPermissionService {
  constructor(
    private readonly em: AppEntityManager,
    private readonly redis: RedisService,
  ) {}

  async getPermissions(roleName: RoleName): Promise<RolePermissions> {
    const cached = await this.redis.get<unknown>(this.rolePermissionKey(roleName));
    if (this.isRolePermissions(cached)) return cached;

    const role = await this.em.findOne(Role, { name: roleName });
    const permissions = role?.permissions ?? {};
    await this.redis.set(this.rolePermissionKey(roleName), permissions, ROLE_PERMISSION_TTL_SECONDS);
    return permissions;
  }

  async invalidatePermissions(roleName: RoleName): Promise<void> {
    await this.redis.del(this.rolePermissionKey(roleName));
  }

  private rolePermissionKey(roleName: RoleName): string {
    return 'auth:role:' + roleName;
  }

  private isRolePermissions(value: unknown): value is RolePermissions {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

    return Object.values(value as Record<string, unknown>)
      .every((actions) => Array.isArray(actions) && actions.every((action) => typeof action === 'string'));
  }
}
