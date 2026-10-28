import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { QueryRequestDtoFor } from '@pkg/server-core/http/dto/request';
import { hashWithSecret } from '@pkg/shared/server';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { User } from '~/core/database/entities/auth';
import { env } from '~/env';

const GetCustomersRequestDtoBase = QueryRequestDtoFor<User>()({
  search: { fields: [] },
  filter: { createdAt: { type: 'date' }, updatedAt: { type: 'date' } },
  sort: { fields: ['createdAt', 'updatedAt'], default: ['createdAt'] },
  page: {},
});

@ApiSchema({ name: 'GetCustomersRequest' })
export class GetCustomersRequestDto extends GetCustomersRequestDtoBase {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'updatedAt'] })
  @IsIn(['createdAt', 'updatedAt'], { each: true })
  override sort: ('createdAt' | 'updatedAt')[] = ['createdAt'];

  @ApiPropertyOptional({ description: '고객 이름 또는 이메일 검색어' })
  @IsOptional()
  @IsString()
  override search?: string;

  override toQuery() {
    const queryOptions = super.toQuery();
    const filters = queryOptions.where;
    const search = this.search?.trim();
    const email = search?.toLowerCase();
    let searchQuery: ObjectQuery<User> | null = null;
    if (search) {
      const nameQuery = { profile: { name: { $ilike: `%${search}%` } } };
      searchQuery = email?.includes('@')
        ? { $or: [nameQuery, { profile: { emailHash: hashWithSecret(email, env.PII_HASH_KEY) } }] }
        : nameQuery;
    }
    const conditions = [filters, searchQuery].filter((query): query is ObjectQuery<User> => !!query && Object.keys(query).length > 0);
    return { ...queryOptions, where: conditions.length ? { $and: conditions } : {} };
  }
}
