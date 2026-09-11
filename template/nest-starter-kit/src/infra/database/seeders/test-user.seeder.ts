import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { hash } from '@pkg/shared/server';

import { Role, RoleKey } from '#/entities/auth.extensions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000002';

export class TestUserSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const existing = await em.findOne(User, { id: TEST_USER_ID }, { filters: false });
    if (existing) return;

    const role = await em.findOneOrFail(Role, { key: RoleKey.USER }, { filters: false });
    const user = em.create(User, {
      id: TEST_USER_ID,
      email: 'user@test.com',
      name: 'Test User',
      emailVerified: true,
      role,
    });
    const password = await hash('1q2w3e4r1@');
    const account = em.create(Account, {
      user,
      accountId: user.id,
      providerId: Account.PROVIDER_CREDENTIAL,
      password,
      metadata: { passwordHistory: [password], failedLoginAttempts: 0 },
    });
    em.persist([user, account]);
  }
}
