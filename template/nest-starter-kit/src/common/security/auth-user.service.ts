import { Injectable } from '@nestjs/common';

import { AppEntityManager } from '#/database/entity-manager';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

import { type AuthPrincipal } from './auth-token.types';

@Injectable()
export class AuthUserService {
  constructor(private readonly em: AppEntityManager) {}

  async getAuthPrincipal(userId: string): Promise<AuthPrincipal | null> {
    const user = await this.em.findOne(User, { id: userId }, { filters: false });
    if (!user || user.isBanned || user.isDeleted) return null;

    const account = await this.em.findOne(Account, {
      user: userId,
      providerId: 'credential',
    }, { filters: false });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      passwordChangedAt: account?.metadata?.passwordUpdatedAt?.getTime() ?? null,
      role: user.role ?? null,
    };
  }
}
