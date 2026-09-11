import { ApiProperty } from '@nestjs/swagger';
import type { ClassConstructor } from 'class-transformer';
import { differenceInDays, isAfter } from 'date-fns';

import { RoleKey } from '#/entities/auth.extensions/role.entity';
import type { Account } from '#/entities/auth/account.entity';
import type { User } from '#/entities/auth/user.entity';

import { UserItemDto } from './user-item.dto';

export class UserDetailDto extends UserItemDto {
  @ApiProperty({ type: [String], description: 'credential 또는 DB에 등록된 OAuth provider 목록' })
  providers!: string[];

  @ApiProperty({ type: 'boolean' })
  hasPassword!: boolean;

  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  passwordUpdatedAt!: string | null;

  @ApiProperty({ type: 'boolean' })
  isPasswordChangeRequired!: boolean;

  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  lastLoginAt!: string | null;

  static fromDetail<T extends UserDetailDto>(
    this: ClassConstructor<T>,
    user: User,
    accounts: Account[] = [],
    expirationDays = 0,
  ): T {
    const passwordAccount = accounts.find((account) => account.isPasswordAccount);
    const passwordUpdatedAt = passwordAccount?.metadata?.passwordUpdatedAt ?? null;
    const deferredUntil = passwordAccount?.metadata?.passwordChangeDeferredUntil;
    const baseDate = passwordUpdatedAt ?? user.createdAt;
    const diffDays = differenceInDays(new Date(), baseDate);

    return (this as unknown as typeof UserDetailDto).fromPlain<T>({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role?.key ?? RoleKey.USER,
      twoFactorEnabled: user.twoFactorEnabled,
      banned: Boolean(user.banExpires && isAfter(user.banExpires, new Date())),
      banReason: user.banReason ?? null,
      banExpires: user.banExpires ?? null,
      deleted: Boolean(user.deletedAt),
      deletedAt: user.deletedAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      providers: [...new Set(accounts.map((account) => account.providerId))],
      hasPassword: Boolean(passwordAccount?.password),
      passwordUpdatedAt: passwordUpdatedAt?.toISOString() ?? null,
      isPasswordChangeRequired:
        Boolean(passwordAccount?.metadata?.passwordResetRequired)
        || ((!deferredUntil || !isAfter(deferredUntil, new Date())) && expirationDays > 0 && diffDays >= expirationDays),
      lastLoginAt: user.metadata?.lastLoginAt?.toISOString() ?? null,
    });
  }
}
