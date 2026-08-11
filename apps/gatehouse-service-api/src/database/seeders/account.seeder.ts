import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { hash } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { ROLE_NAMES, type RoleName } from '#/entities/auth/role.entity';
import { User } from '#/entities/auth/user.entity';

const CREDENTIAL_PROVIDER = 'credential';
const SEED_USER_EMAIL = 'test@test.com';
const SEED_USER_PASSWORD = '1q2w3e41@';
const SEED_USER_NAME = 'Seed User';

export class AccountSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.ensureCredentialUser(em, {
      email: SEED_USER_EMAIL,
      name: SEED_USER_NAME,
      password: SEED_USER_PASSWORD,
      role: ROLE_NAMES.USER,
    });
  }

  private async ensureCredentialUser(
    em: EntityManager,
    input: { email: string, name: string, password: string, role: RoleName },
  ): Promise<void> {
    const email = input.email.trim().toLowerCase();

    let user = await em.findOne(User, { email }, { filters: false });
    if (!user) {
      user = em.create(
        User,
        {
          email,
          name: input.name,
          emailVerified: true,
          role: input.role,
        },
      );
      em.persist(user);
    }

    let account = await em.findOne(
      Account,
      {
        user: user.id,
        accountId: user.id,
        providerId: CREDENTIAL_PROVIDER,
      },
      { filters: false },
    );
    if (!account) {
      const hundredDaysAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
      const hashedPassword = await hash(input.password);

      account = em.create(
        Account,
        {
          user,
          accountId: user.id,
          providerId: CREDENTIAL_PROVIDER,
          password: hashedPassword,
          metadata: {
            passwordUpdatedAt: hundredDaysAgo,
            passwordHistory: [hashedPassword],
            failedLoginAttempts: 0,
          },
        },
      );
      em.persist(account);
    }

    await em.flush();
    console.log(`Ensured credential user: ${email} (${input.role})`);
  }
}
