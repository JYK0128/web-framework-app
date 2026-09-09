import { ApiProperty } from '@nestjs/swagger';
import { differenceInDays, isAfter } from 'date-fns';

import type { Account } from '#/entities/auth/account.entity';
import type { User } from '#/entities/auth/user.entity';

import { UserItemDto } from './user-item.dto';

export class UserDetailDto extends UserItemDto {
  constructor(user: User, accounts: Account[], expirationDays: number) {
    super(user);
    const passwordAccount = accounts.find((account) => account.isPasswordAccount);
    const passwordUpdatedAt = passwordAccount?.metadata?.passwordUpdatedAt ?? null;
    const deferredUntil = passwordAccount?.metadata?.passwordChangeDeferredUntil;
    const baseDate = passwordUpdatedAt ?? user.createdAt;
    const diffDays = differenceInDays(new Date(), baseDate);
    this.providers = [...new Set(accounts.map((account) => account.providerId))];
    this.hasPassword = Boolean(passwordAccount?.password);
    this.passwordUpdatedAt = passwordUpdatedAt?.toISOString() ?? null;
    this.isPasswordChangeRequired = Boolean(passwordAccount?.metadata?.passwordResetRequired)
      || ((!deferredUntil || !isAfter(deferredUntil, new Date())) && expirationDays > 0 && diffDays >= expirationDays);
    this.lastLoginAt = user.metadata?.lastLoginAt?.toISOString() ?? null;
  }

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
}
