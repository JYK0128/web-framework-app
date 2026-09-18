import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { hash } from '@pkg/shared/server';

import { Role, RoleCode } from '#/entities/auth.extensions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

export class UserSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    let superUserRole = await em.findOne(Role, { code: RoleCode.SUPER_USER }, { filters: false });
    if (!superUserRole) {
      superUserRole = em.create(Role, {
        code: RoleCode.SUPER_USER,
        label: '슈퍼 유저',
        description: '기능 테스트 및 데모/홍보용 슈퍼 유저',
        isSystem: true,
        permissions: ['*'],
      });
      em.persist(superUserRole);
    }

    await em.flush();

    const existingUserCount = await em.count(User, {
      role: superUserRole,
    }, { filters: false });

    if (existingUserCount > 0) {
      return;
    }

    const defaultEmail = env.SUPER_USER_INIT_EMAIL;
    const defaultPassword = env.SUPER_USER_INIT_PASSWORD;

    const user = em.create(User, {
      email: defaultEmail,
      name: 'Super User',
      emailVerified: true,
      role: superUserRole,
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

    console.log(`[UserSeeder] Successfully seeded initial Super User (${defaultEmail})`);
  }
}
