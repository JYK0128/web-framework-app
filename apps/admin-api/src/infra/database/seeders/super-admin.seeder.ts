import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { ALL_PERMISSIONS, Permission } from '@pkg/shared';
import { hash } from '@pkg/shared/server';

import { Role, RoleCode } from '#/entities/auth.extensions/role.entity';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

const ADMIN_INIT_EMAIL = 'admin@test.com';
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- local development seed account only
const ADMIN_INIT_PASSWORD = '1q2w3e4r1@';

export class SuperAdminSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const allPermissionCodes = ALL_PERMISSIONS.map(({ code }) => code);
    let superAdminRole = await em.findOne(Role, { code: RoleCode.SUPER_ADMIN }, { filters: false });
    if (!superAdminRole) {
      superAdminRole = em.create(Role, {
        code: RoleCode.SUPER_ADMIN,
        label: '최고 관리자',
        description: '시스템 전체 권한을 보유한 최고 관리자',
        isSystem: true,
        permissions: allPermissionCodes,
      });
      em.persist(superAdminRole);
    }
    else {
      superAdminRole.permissions = allPermissionCodes;
      superAdminRole.deletedAt = null;
      superAdminRole.deletedBy = null;
    }

    let adminRole = await em.findOne(Role, { code: RoleCode.ADMIN }, { filters: false });
    if (!adminRole) {
      adminRole = em.create(Role, {
        code: RoleCode.ADMIN,
        label: '관리자',
        description: '관리자 계정 조회 권한을 보유한 운영 역할',
        isSystem: true,
        permissions: [Permission.user.read.code],
      });
      em.persist(adminRole);
    }
    else {
      adminRole.permissions = [Permission.user.read.code];
      adminRole.deletedAt = null;
      adminRole.deletedBy = null;
    }

    await em.flush();

    const initialEmail = ADMIN_INIT_EMAIL;
    const initialPassword = ADMIN_INIT_PASSWORD;
    const existingSuperAdmin = await em.findOne(User, { email: initialEmail }, { filters: false });

    if (existingSuperAdmin) {
      const existingAccount = await em.findOne(Account, {
        user: existingSuperAdmin.id,
        providerId: Account.PROVIDER_CREDENTIAL,
      }, { filters: false });

      if (existingAccount) {
        existingAccount.password = await hash(initialPassword);
        existingSuperAdmin.updateMetadata({
          failedLoginAttempts: 0,
          lockedUntil: null,
        });
        await em.flush();
        console.log(`[SuperAdminSeeder] Reset local SuperAdmin credentials (${initialEmail})`);
        return;
      }
    }

    const user = em.create(User, {
      email: initialEmail,
      name: 'Super Admin',
      emailVerified: true,
      role: superAdminRole,
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

    console.log(`[SuperAdminSeeder] Successfully seeded initial SuperAdmin (${initialEmail})`);
  }
}
