import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { ALL_PERMISSIONS } from '@pkg/shared';

import { Permission as PermissionEntity } from '#/entities/auth.extensions/permission.entity';

export class PermissionsSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const permissionCodes = new Set(ALL_PERMISSIONS.map(({ code }) => code));
    const storedPermissions = await em.find(PermissionEntity, {}, { filters: false });

    for (const permission of storedPermissions) {
      if (!permissionCodes.has(permission.code) && !permission.deletedAt) {
        permission.deletedAt = new Date();
      }
    }

    for (const definition of ALL_PERMISSIONS) {
      const permission = await em.findOne(PermissionEntity, { code: definition.code }, { filters: false });

      if (permission) {
        permission.label = definition.label;
        permission.description = definition.description ?? null;
        permission.deletedAt = null;
        permission.deletedBy = null;
        continue;
      }

      em.persist(em.create(PermissionEntity, {
        code: definition.code,
        label: definition.label,
        description: definition.description ?? null,
      }));
    }

    await em.flush();
  }
}
