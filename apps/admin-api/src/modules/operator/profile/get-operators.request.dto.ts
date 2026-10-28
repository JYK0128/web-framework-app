import type { ObjectQuery, QueryOrderMap } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ApiEnumOptional, ToBoolean } from '@pkg/server-core/http/decorators';
import { QueryRequestDtoFor, SortDirection } from '@pkg/server-core/http/dto/request';
import { parseSearchTokens } from '@pkg/shared/common';
import { hashWithSecret } from '@pkg/shared/server';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { User } from '~/core/database/entities/auth';
import { env } from '~/env';
import { OperatorStatus } from '~/modules/operator/profile/operator-status.enum';

export const OPERATOR_SORT_FIELDS = ['name', 'twoFactorEnabled', 'createdAt', 'updatedAt'] as const;
export type OperatorSortField = (typeof OPERATOR_SORT_FIELDS)[number];

const GetOperatorsRequestDtoBase = QueryRequestDtoFor<User>()({
  search: { fields: [] },
  sort: { fields: OPERATOR_SORT_FIELDS, default: ['createdAt'] },
  page: {},
});

export class GetOperatorsRequestDto extends GetOperatorsRequestDtoBase {
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

  override toQuery() {
    const baseQuery = super.toQuery();
    const conditions: ObjectQuery<User>[] = [baseQuery.where];

    const term = this.search?.trim();
    if (term) {
      const { original, qwertyConverted, choseongRegex } = parseSearchTokens(term);
      const nameMatchers: Record<string, string>[] = [{ $like: `%${original}%` }];
      if (qwertyConverted && qwertyConverted !== original) nameMatchers.push({ $like: `%${qwertyConverted}%` });
      if (choseongRegex) nameMatchers.push({ $re: choseongRegex });
      conditions.push({
        $or: [
          ...nameMatchers.map((matcher) => ({ profile: { name: matcher } })),
          { profile: { emailHash: hashWithSecret(term, env.PII_HASH_KEY) } },
        ],
      });
    }

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

    return {
      ...baseQuery,
      where: { $and: conditions },
      orderBy: this.sort.map<QueryOrderMap<User>>((field, index) => {
        const direction = this.direction[index] ?? SortDirection.ASC;
        return field === 'name' ? { profile: { name: direction } } : { [field]: direction };
      }),
    };
  }
}
