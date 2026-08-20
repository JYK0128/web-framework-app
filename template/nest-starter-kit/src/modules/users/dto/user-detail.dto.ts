import { ApiProperty } from '@nestjs/swagger';
import { differenceInDays, isAfter } from 'date-fns';

import { PASSWORD_EXPIRATION_DAYS } from '#/common/constants/app.constants';
import type { Account } from '#/entities/auth/account.entity';
import type { User } from '#/entities/auth/user.entity';

import { UserItemDto } from './user-item.dto';

export class UserDetailDto extends UserItemDto {
  constructor(user: User, accounts: Account[]) {
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
      || ((!deferredUntil || !isAfter(deferredUntil, new Date())) && diffDays >= PASSWORD_EXPIRATION_DAYS);
    this.lastLoginAt = user.metadata?.lastLoginAt?.toISOString() ?? null;
  }

  @ApiProperty({ type: [String] })
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
