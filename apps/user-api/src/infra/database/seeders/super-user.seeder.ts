import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { hash } from '@pkg/shared/server';

import { Role, RoleCode } from '#/entities/auth.extensions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

const USER_INIT_EMAIL = 'user@test.com';
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- local development seed account only
const USER_INIT_PASSWORD = '1q2w3e4r1@';

export class SuperUserSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    let superUserRole = await em.findOne(Role, { code: RoleCode.SUPER_USER }, { filters: false });
    if (!superUserRole) {
      superUserRole = em.create(Role, {
        code: RoleCode.SUPER_USER,
        label: '최고 관리자',
        description: '시스템 전체 권한을 보유한 최고 관리자',
        isSystem: true,
        permissions: ['*'],
      });
      em.persist(superUserRole);
    }

    await em.flush();

    const initialEmail = USER_INIT_EMAIL;
    const initialPassword = USER_INIT_PASSWORD;
    const existingSuperUser = await em.findOne(User, { email: initialEmail }, { filters: false });

    if (existingSuperUser) {
      const existingAccount = await em.findOne(Account, {
        user: existingSuperUser.id,
        providerId: Account.PROVIDER_CREDENTIAL,
      }, { filters: false });

      if (existingAccount) {
        existingAccount.password = await hash(initialPassword);
        existingSuperUser.updateMetadata({
          failedLoginAttempts: 0,
          lockedUntil: null,
        });
        await em.flush();
        console.log(`[SuperUserSeeder] Reset local SuperUser credentials (${initialEmail})`);
        return;
      }
    }

    const user = em.create(User, {
      email: initialEmail,
      name: 'Super User',
      emailVerified: true,
      role: superUserRole,
    });

    const hashedPassword = await hash(initialPassword);

    const account = em.create(Account, {
      user,
      accountId: initialEmail,
      providerId: Account.PROVIDER_CREDENTIAL,
      password: hashedPassword,
    });

    em.persist([user, account]);
    await em.flush();

    console.log(`[SuperUserSeeder] Successfully seeded initial SuperUser (${initialEmail})`);
  }
}
