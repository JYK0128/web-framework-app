import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Role, ROLE_NAMES, type RoleName, type RolePermissions } from '#/entities/auth.extentions/role.entity';

const ROLE_SEEDS: ReadonlyArray<{ name: RoleName, permissions: RolePermissions }> = [
  {
    name: ROLE_NAMES.USER,
    permissions: {
      term: ['read', 'update'],
      notice: ['read'],
      faq: ['read'],
    },
  },
  {
    name: ROLE_NAMES.ADMIN,
    permissions: {
      term: ['create', 'read', 'update', 'delete'],
      role: ['create', 'read', 'update', 'delete'],
      user: ['create', 'read', 'update', 'delete'],
      notice: ['create', 'read', 'update', 'delete', 'manage'],
      faq: ['create', 'read', 'update', 'delete', 'manage'],
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
