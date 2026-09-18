import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { hash } from '@pkg/shared/server';

import { Role, RoleCode } from '#/entities/auth.extensions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

export class SuperAdminSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    let superAdminRole = await em.findOne(Role, { code: RoleCode.SUPER_ADMIN }, { filters: false });
    if (!superAdminRole) {
      superAdminRole = em.create(Role, {
        code: RoleCode.SUPER_ADMIN,
        label: '최고 관리자',
        description: '시스템 전체 권한을 보유한 최고 관리자',
        isSystem: true,
        permissions: ['*'],
      });
      em.persist(superAdminRole);
    }

    await em.flush();

    const existingSuperAdminCount = await em.count(User, {
      role: superAdminRole,
    }, { filters: false });

    if (existingSuperAdminCount > 0) {
      return;
    }

    const defaultEmail = env.ADMIN_INIT_EMAIL;
    const defaultPassword = env.ADMIN_INIT_PASSWORD;

    const user = em.create(User, {
      email: defaultEmail,
      name: 'Super Admin',
      emailVerified: true,
      role: superAdminRole,
    });

    const hashedPassword = await hash(defaultPassword);

    const account = em.create(Account, {
      user,
      accountId: defaultEmail,
      providerId: Account.PROVIDER_CREDENTIAL,
      password: hashedPassword,
    });

    em.persist([user, account]);
    await em.flush();

    console.log(`[SuperAdminSeeder] Successfully seeded initial SuperAdmin (${defaultEmail})`);
  }
}
