import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { ALL_SERVICE_PERMISSIONS } from '#/common/auth/permissions';
import { Permission } from '#/entities/auth.extensions/permission.entity';

export class PermissionsSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const permissionCodes = new Set(ALL_SERVICE_PERMISSIONS.map(({ code }) => code));
    const storedPermissions = await em.find(Permission, {}, { filters: false });

    for (const permission of storedPermissions) {
      if (!permissionCodes.has(permission.code) && !permission.deletedAt) {
        permission.deletedAt = new Date();
      }
    }

    for (const definition of ALL_SERVICE_PERMISSIONS) {
      const permission = await em.findOne(Permission, { code: definition.code }, { filters: false });

      if (permission) {
        permission.label = definition.label;
        permission.description = definition.description ?? null;
        permission.deletedAt = null;
        permission.deletedBy = null;
        continue;
      }

      em.persist(em.create(Permission, {
        code: definition.code,
        label: definition.label,
        description: definition.description ?? null,
      }));
    }

    await em.flush();
  }
}
