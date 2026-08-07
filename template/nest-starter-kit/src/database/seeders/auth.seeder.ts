import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { hash } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

const CREDENTIAL_PROVIDER = 'credential';

export class AuthSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const email = env.SEED_USER_EMAIL.trim().toLowerCase();
    const hundredDaysAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    const hashedPassword = await hash(env.SEED_USER_PASSWORD);

    let user = await em.findOne(User, { email }, { filters: false });
    if (!user) {
      user = em.create(
        User,
        {
          email,
          name: env.SEED_USER_NAME,
          emailVerified: true,
        },
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
    else {
      account.password = hashedPassword;
      const currentHistory = account.metadata?.passwordHistory || [];
      const updatedHistory = currentHistory.includes(hashedPassword)
        ? currentHistory
        : [hashedPassword, ...currentHistory].slice(0, 3);

      account.updateMetadata({
        passwordUpdatedAt: hundredDaysAgo,
        passwordHistory: updatedHistory,
        failedLoginAttempts: 0,
        passwordChangeDeferredUntil: null,
        lockedUntil: null,
      });
      account.deletedAt = null;
      account.deletedBy = null;
    }

    await em.flush();
    console.log(`Seeded credential user: ${email} with passwordUpdatedAt: ${hundredDaysAgo.toISOString()} and cleared deferral`);
  }
}
