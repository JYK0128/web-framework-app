import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Role, ROLE_NAMES, type RoleName, type RolePermissions } from '#/entities/auth/role.entity';

const ROLE_SEEDS: ReadonlyArray<{ role: RoleName, permissions: RolePermissions }> = [
  {
    role: ROLE_NAMES.ANONYMOUS,
    permissions: {
      term: ['read'],
    },
  },
  {
    role: ROLE_NAMES.USER,
    permissions: {
      term: ['read', 'agree'],
    },
  },
  {
    role: ROLE_NAMES.ADMIN,
    permissions: {
      term: ['read', 'agree'],
      admin: ['read', 'write'],
    },
  },
];

export class RoleSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const seed of ROLE_SEEDS) {
      let role = await em.findOne(Role, { role: seed.role });
      if (!role) {
        role = em.create(Role, {
          role: seed.role,
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
