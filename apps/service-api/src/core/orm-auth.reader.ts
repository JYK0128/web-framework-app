import { Injectable } from '@nestjs/common';
import type { AuthAccount, AuthReader, AuthUser } from '@pkg/server-core/auth/user/user-auth.interface';

import { Account, User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';

@Injectable()
export class OrmAuthReader implements AuthReader {
  constructor(private readonly em: AppEntityManager) {}

  async findUserById(userId: string): Promise<AuthUser | null> {
    const user = await this.em.findOne(User, { id: userId }, { populate: ['role'], filters: false });
    if (!user) return null;
    return {
      id: user.id,
      phoneNumberVerified: user.phoneNumberVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      isDeleted: user.isDeleted,
      isBanned: user.isBanned,
      isLocked: user.isLocked,
      role: user.role ? { id: user.role.id, code: user.role.code, permissions: user.role.permissions ?? [] } : null,
    };
  }

  async findCredentialAccount(userId: string): Promise<AuthAccount | null> {
    const account = await this.em.findOne(Account, { user: userId, providerId: Account.PROVIDER_CREDENTIAL });
    return account;
  }
}
