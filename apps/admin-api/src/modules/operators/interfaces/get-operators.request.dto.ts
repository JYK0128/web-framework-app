import type { ObjectQuery, QueryOrderMap } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { parseSearchTokens } from '@pkg/shared/common';
import { hmac } from '@pkg/shared/server';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { ToBoolean } from '#/common/decorators/to-boolean.decorator';
import { PageRequestDto, type PageRequestOptions } from '#/common/interfaces/request';
import { SortDirection } from '#/common/interfaces/request/sortable.request.dto';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

import { OperatorStatus } from './operator-status.enum';

export const OPERATOR_SORT_FIELDS = ['name', 'twoFactorEnabled', 'createdAt', 'updatedAt'] as const;
export type OperatorSortField = (typeof OPERATOR_SORT_FIELDS)[number];

export class GetOperatorsRequestDto extends PageRequestDto<User, OperatorSortField> {
  override toSearchQuery(): ObjectQuery<User> | null {
    const term = this.search?.trim();
    if (!term) return null;

    const { original, qwertyConverted, choseongRegex } = parseSearchTokens(term);
    const nameMatchers: Record<string, string>[] = [{ $like: `%${original}%` }];
    if (qwertyConverted && qwertyConverted !== original) nameMatchers.push({ $like: `%${qwertyConverted}%` });
    if (choseongRegex) nameMatchers.push({ $re: choseongRegex });

    return {
      $or: [
        ...nameMatchers.map((matcher) => ({ profile: { name: matcher } })),
        { profile: { emailHash: hmac(term, env.PII_HASH_KEY) } },
      ],
    };
  }

  @ApiPropertyOptional({ type: 'boolean', default: false })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  includeDeleted = false;

  @ApiEnumOptional({ enum: OperatorStatus })
  @IsOptional()
  @IsEnum(OperatorStatus)
  status?: OperatorStatus;

  @ApiPropertyOptional({ type: 'boolean' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  override sort: OperatorSortField[] = ['createdAt'];

  override toPageOptions(): PageRequestOptions<User> {
    return {
      page: this.page,
      limit: this.limit,
      orderBy: this.sort.map<QueryOrderMap<User>>((field, index) => {
        const direction = this.direction[index] ?? SortDirection.ASC;
        return field === 'name' ? { profile: { name: direction } } : { [field]: direction };
      }),
    };
  }

  override toFilterQuery(): ObjectQuery<User> {
    const baseQuery = super.toFilterQuery();
    const conditions: ObjectQuery<User>[] = [baseQuery];

    if (this.status === OperatorStatus.BANNED) {
      conditions.push({ $or: [{ banned: true, $or: [{ banExpires: null }, { banExpires: { $gt: new Date() } }] }, { banExpires: { $gt: new Date() } }] });
    }
    else if (this.status === OperatorStatus.DELETED) {
      conditions.push({ deletedAt: { $ne: null } });
    }
    else if (this.status === OperatorStatus.ACTIVE) {
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
