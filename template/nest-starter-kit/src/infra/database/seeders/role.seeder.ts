import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Role, RoleName, type RolePermissions } from '#/entities/auth.extentions/role.entity';

const ROLE_SEEDS: ReadonlyArray<{
  name: string
  label: string
  description: string
  isSystem: boolean
  permissions: RolePermissions
}> = [
  {
    name: RoleName.USER,
    label: '일반 회원',
    description: '서비스 기본 이용자 권한',
    isSystem: true,
    permissions: {
      term: ['read', 'update'],
      notice: ['read'],
      faq: ['read'],
      inquiry: ['create', 'read', 'update'],
    },
  },
  {
    name: RoleName.ADMIN,
    label: '최고 관리자',
    description: '시스템 전체 제어 및 최고 관리 권한',
    isSystem: true,
    permissions: {
      user: ['create', 'read', 'update', 'delete', 'manage'],
      role: ['create', 'read', 'update', 'delete', 'manage'],
      notice: ['create', 'read', 'update', 'delete', 'manage'],
      faq: ['create', 'read', 'update', 'delete', 'manage'],
      inquiry: ['create', 'read', 'update', 'delete', 'manage'],
      term: ['create', 'read', 'update', 'delete', 'manage'],
      activityLog: ['create', 'read', 'update', 'delete', 'manage'],
      system: ['create', 'read', 'update', 'delete', 'manage'],
      template: ['create', 'read', 'update', 'delete', 'manage'],
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
          label: seed.label,
          description: seed.description,
          isSystem: seed.isSystem,
          permissions: seed.permissions,
        });
        em.persist(role);
      }
      else {
        role.label = role.label ?? seed.label;
        role.description = role.description ?? seed.description;
        role.isSystem = seed.isSystem;
        role.permissions = seed.permissions;
      }
    }
    await em.flush();
  }
}
