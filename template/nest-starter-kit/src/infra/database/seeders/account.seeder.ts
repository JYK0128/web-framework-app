import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { hash } from '@pkg/shared/server';

import { RoleKey } from '#/entities/auth.extentions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

/**
 * Deterministic fixed UUID for initial system admin user.
 * Ensures seed data identity is preserved even if admin updates email/phone/password in UI.
 */
export const INITIAL_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

export class AccountSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // 1. Check if initial admin already exists by deterministic UUID
    let admin = await em.findOne(User, { id: INITIAL_ADMIN_USER_ID }, { filters: false });

    if (admin) {
      console.log(`[AccountSeeder] Initial admin already exists (ID: ${INITIAL_ADMIN_USER_ID}). Preserving user changes.`);
      return;
    }

    // 2. Fallback check: If an admin user was created in older seed runs with random UUID by email
    const defaultEmail = 'admin@test.com';
    const defaultPhone = '01000000000';

    admin = await em.findOne(User, { email: defaultEmail }, { filters: false });
    if (admin) {
      console.log(`[AccountSeeder] Admin found by email (${defaultEmail}). Skipping creation.`);
      return;
    }

    // 3. Prevent unique constraint violation if default phone/email was claimed by test users
    const conflictUser = await em.findOne(
      User,
      { $or: [{ email: defaultEmail }, { phoneNumber: defaultPhone }] },
      { filters: false },
    );
    if (conflictUser) {
      if (conflictUser.email === defaultEmail) {
        conflictUser.email = `claimed_${Date.now()}@test.com`;
      }
      if (conflictUser.phoneNumber === defaultPhone) {
        conflictUser.phoneNumber = null;
        conflictUser.phoneNumberVerified = false;
      }
    }

    // 4. Create initial admin with deterministic UUID
    admin = em.create(User, {
      id: INITIAL_ADMIN_USER_ID,
      email: defaultEmail,
      name: 'Admin User',
      emailVerified: true,
      phoneNumber: defaultPhone,
      phoneNumberVerified: true,
      role: RoleKey.ADMIN,
    });
    em.persist(admin);

    // 5. Create credential account binding
    const hundredDaysAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    const hashedPassword = await hash('1q2w3e4r1@');

    const account = em.create(Account, {
      user: admin,
      accountId: admin.id,
      providerId: Account.PROVIDER_CREDENTIAL,
      password: hashedPassword,
      metadata: {
        passwordUpdatedAt: hundredDaysAgo,
        passwordHistory: [hashedPassword],
        failedLoginAttempts: 0,
      },
    });
    em.persist(account);

    await em.flush();
    console.log(`[AccountSeeder] Created initial admin with fixed ID: ${INITIAL_ADMIN_USER_ID} (${defaultEmail})`);
  }
}
