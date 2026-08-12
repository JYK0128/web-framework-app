/* eslint-disable sonarjs/no-hardcoded-passwords */
import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { hash } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { ROLE_NAMES, type RoleName } from '#/entities/auth/role.entity';
import { User } from '#/entities/auth/user.entity';

const CREDENTIAL_PROVIDER = 'credential';

interface SeedUserInput {
  email: string
  name: string
  password?: string
  role: RoleName
  banned?: boolean
  banReason?: string
  twoFactorEnabled?: boolean
}

const SEED_ADMIN_USERS: SeedUserInput[] = [
  {
    email: 'admin@gatehouse.local',
    name: 'Gatehouse Admin',
    password: 'Admin1234!',
    role: ROLE_NAMES.SUPER_ADMIN,
    twoFactorEnabled: false,
  },
];

export class AccountSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const userInput of SEED_ADMIN_USERS) {
      await this.ensureCredentialUser(em, userInput);
    }
  }

  private async ensureCredentialUser(
    em: EntityManager,
    input: SeedUserInput,
  ): Promise<void> {
    const email = input.email.trim().toLowerCase();
    const defaultPassword = input.password ?? 'Admin1234!';

    let user = await em.findOne(User, { email }, { filters: false });
    if (!user) {
      user = em.create(
        User,
        {
          email,
          name: input.name,
          emailVerified: true,
          role: input.role,
          banned: input.banned ?? false,
          banReason: input.banReason ?? null,
          twoFactorEnabled: input.twoFactorEnabled ?? false,
        },
      );
      em.persist(user);
    }
    else {
      user.name = input.name;
      user.role = input.role;
      user.banned = input.banned ?? false;
      user.banReason = input.banReason ?? null;
      user.twoFactorEnabled = input.twoFactorEnabled ?? false;
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
      const hashedPassword = await hash(defaultPassword);

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
    console.log(`Ensured credential admin user: ${email} (${input.role}) [banned: ${input.banned ?? false}]`);
  }
}
