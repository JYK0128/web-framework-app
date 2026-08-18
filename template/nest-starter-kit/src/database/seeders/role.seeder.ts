import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Role, RoleName, type RolePermissions } from '#/entities/auth.extentions/role.entity';

const ROLE_SEEDS: ReadonlyArray<{ name: RoleName, permissions: RolePermissions }> = [
  {
    name: RoleName.USER,
    permissions: {
      term: ['read', 'update'],
      notice: ['read'],
      faq: ['read'],
      inquiry: ['create', 'read'],
    },
  },
  {
    name: RoleName.ADMIN,
    permissions: {
      term: ['create', 'read', 'update', 'delete', 'manage'],
      role: ['create', 'read', 'update', 'delete', 'manage'],
      user: ['create', 'read', 'update', 'delete', 'manage'],
      notice: ['create', 'read', 'update', 'delete', 'manage'],
      faq: ['create', 'read', 'update', 'delete', 'manage'],
      systemSetting: ['create', 'read', 'update', 'delete', 'manage'],
      activityLog: ['read', 'manage'],
      inquiry: ['read', 'manage'],
    },
  },
];

export class RoleSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const seed of ROLE_SEEDS) {
      let role = await em.findOne(Role, { name: seed.name });
      if (!role) {
        role = em.create(Role, {
          name: seed.name,
          permissions: seed.permissions,
        });
        em.persist(role);
      }
      else {
        role.permissions = seed.permissions;
      }
    }
    await em.flush();
  }
}
