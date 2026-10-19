import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { hmac } from '@pkg/shared/server';
import { IsIn, IsOptional, IsString } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

@ApiSchema({ name: 'GetCustomersRequest' })
export class GetCustomersRequestDto extends PageRequestDto<User, 'createdAt' | 'updatedAt'> {
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'updatedAt'] })
  @IsIn(['createdAt', 'updatedAt'], { each: true })
  override sort: ('createdAt' | 'updatedAt')[] = ['createdAt'];

  @ApiPropertyOptional({ description: '고객 이름 또는 이메일 검색어' })
  @IsOptional()
  @IsString()
  override search?: string;

  override toFilterQuery(): ObjectQuery<User> {
    const filters = this.filters.toFilterQuery();
    const search = this.search?.trim();
    const email = search?.toLowerCase();
    let searchQuery: ObjectQuery<User> | null = null;
    if (search) {
      const nameQuery = { profile: { name: { $ilike: `%${search}%` } } };
      searchQuery = email?.includes('@')
        ? { $or: [nameQuery, { profile: { emailHash: hmac(email, env.PII_HASH_KEY) } }] }
        : nameQuery;
    }
    const conditions = [filters, searchQuery].filter((query): query is ObjectQuery<User> => !!query && Object.keys(query).length > 0);
    return { $and: conditions };
  }
}
