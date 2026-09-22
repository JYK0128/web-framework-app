import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { parseSearchTokens } from '@pkg/shared/common';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { ToBoolean } from '#/common/decorators/to-boolean.decorator';
import { PageRequestDto } from '#/common/interfaces/request';
import { hashEmail } from '#/common/security/pii';
import { User } from '#/entities/auth/user.entity';

import { UserStatus } from './user-status.enum';

export const USER_SORT_FIELDS = ['name', 'twoFactorEnabled', 'createdAt', 'updatedAt'] as const;
export type UserSortField = (typeof USER_SORT_FIELDS)[number];

export class GetUsersRequestDto extends PageRequestDto<User, UserSortField> {
  override get searchFields(): (keyof User)[] {
    return ['name'];
  }

  override toSearchQuery(): ObjectQuery<User> | null {
    const term = this.search?.trim();
    if (!term) return null;

    const { original, qwertyConverted, choseongRegex } = parseSearchTokens(term);
    const nameMatchers: Record<string, string>[] = [{ $like: `%${original}%` }];
    if (qwertyConverted && qwertyConverted !== original) nameMatchers.push({ $like: `%${qwertyConverted}%` });
    if (choseongRegex) nameMatchers.push({ $re: choseongRegex });

    return {
      $or: [
        ...nameMatchers.map((matcher) => ({ name: matcher })),
        { emailHash: hashEmail(term) },
      ],
    };
  }

  @ApiPropertyOptional({ type: 'boolean', default: false })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  includeDeleted = false;

  @ApiEnumOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ type: 'boolean' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  override sort: UserSortField[] = ['createdAt'];

  override toFilterQuery(): ObjectQuery<User> {
    const baseQuery = super.toFilterQuery();
    const conditions: ObjectQuery<User>[] = [baseQuery];

    if (this.status === UserStatus.BANNED) {
      conditions.push({ $or: [{ banned: true, $or: [{ banExpires: null }, { banExpires: { $gt: new Date() } }] }, { banExpires: { $gt: new Date() } }] });
    }
    else if (this.status === UserStatus.DELETED) {
      conditions.push({ deletedAt: { $ne: null } });
    }
    else if (this.status === UserStatus.ACTIVE) {
      conditions.push({ deletedAt: null });
      conditions.push({ $or: [{ banned: false, $or: [{ banExpires: null }, { banExpires: { $lte: new Date() } }] }, { banned: true, banExpires: { $lte: new Date() } }] });
    }

    if (this.twoFactorEnabled !== undefined) {
      conditions.push({ twoFactorEnabled: this.twoFactorEnabled });
    }

    if (!this.status && !this.includeDeleted) {
      conditions.push({ deletedAt: null });
    }

    return { $and: conditions };
  }
}
