import { ApiProperty } from '@nestjs/swagger';
import { differenceInDays, isAfter } from 'date-fns';

import type { Account } from '#/entities/auth/account.entity';
import type { User } from '#/entities/auth/user.entity';
import { PASSWORD_EXPIRATION_DAYS } from '#/modules/auth/constants/auth-policy.constants';

import { UserItemDto } from './user-item.dto';

export class UserDetailDto extends UserItemDto {
  constructor(user: User, accounts: Account[]) {
    super(user);

    const passwordAccount = accounts.find((account) => account.isPasswordAccount);
    const passwordUpdatedAt = passwordAccount?.metadata?.passwordUpdatedAt ?? null;
    const deferredUntil = passwordAccount?.metadata?.passwordChangeDeferredUntil;
    const targetDate = passwordUpdatedAt ?? user.createdAt;
    const diffDays = differenceInDays(new Date(), targetDate);
    this.providers = [...new Set(accounts.map((account) => account.providerId))];
    this.hasPassword = Boolean(passwordAccount?.password);
    this.passwordUpdatedAt = passwordUpdatedAt?.toISOString() ?? null;
    this.isPasswordChangeRequired = Boolean(passwordAccount?.metadata?.passwordResetRequired)
      || ((!deferredUntil || !isAfter(deferredUntil, new Date())) && diffDays >= PASSWORD_EXPIRATION_DAYS);
    this.lastLoginAt = user.metadata?.lastLoginAt?.toISOString() ?? null;
  }

  @ApiProperty({ type: String, example: 'Repeated failed login attempts', nullable: true, required: false })
  override banReason!: string | null;

  @ApiProperty({ type: String, example: '2026-08-20T00:00:00.000Z', format: 'date-time', nullable: true, required: false })
  override banExpires!: string | null;

  @ApiProperty({ type: String, example: null, format: 'date-time', nullable: true, required: false })
  override deletedAt!: string | null;

  @ApiProperty({ example: ['credential', 'google'] })
  providers!: string[];

  @ApiProperty({ example: true })
  hasPassword!: boolean;

  @ApiProperty({ type: String, example: '2026-08-12T00:00:00.000Z', format: 'date-time', nullable: true, required: false })
  passwordUpdatedAt!: string | null;

  @ApiProperty({ example: false })
  isPasswordChangeRequired!: boolean;

  @ApiProperty({ type: String, example: '2026-08-12T08:30:00.000Z', format: 'date-time', nullable: true, required: false })
  lastLoginAt!: string | null;
}
