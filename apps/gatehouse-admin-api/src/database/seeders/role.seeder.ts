import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Role, ROLE_NAMES, type RolePermissions, type SystemRoleName } from '#/entities/auth/role.entity';

const ROLE_SEEDS: ReadonlyArray<{ name: SystemRoleName, permissions: RolePermissions }> = [
  {
    name: ROLE_NAMES.ADMIN,
    permissions: {
      'term': ['read', 'agree'],
      'admin': ['read', 'write'],
      'service-user': ['read', 'write'],
    },
  },
  {
    name: ROLE_NAMES.SUPER_ADMIN,
    permissions: {
      'term': ['read', 'agree'],
      'admin': ['read', 'write'],
      'admin-user': ['read', 'write'],
      'service-user': ['read', 'write'],
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
