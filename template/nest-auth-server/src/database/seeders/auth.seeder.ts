import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { hashPassword } from '#/modules/auth/password-hasher';

const CREDENTIAL_PROVIDER = 'credential';

export class AuthSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const email = env.SEED_USER_EMAIL.trim().toLowerCase();

    let user = await em.findOne(User, { email }, { filters: false });
    if (!user) {
      user = em.create(
        User,
        {
          email,
          name: env.SEED_USER_NAME,
          emailVerified: true,
        },
        { partial: true, persist: false },
      );
      em.persist(user);
    }
    else {
      user.name = env.SEED_USER_NAME;
      user.emailVerified = true;
      user.deletedAt = null;
      user.deletedBy = null;
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
      account = em.create(
        Account,
        {
          user,
          accountId: user.id,
          providerId: CREDENTIAL_PROVIDER,
          password: await hashPassword(env.SEED_USER_PASSWORD),
        },
        { partial: true, persist: false },
      );
      em.persist(account);
    }
    else {
      account.password = await hashPassword(env.SEED_USER_PASSWORD);
      account.deletedAt = null;
      account.deletedBy = null;
    }

    await em.flush();
    console.log(`Seeded credential user: ${email}`);
  }
}
