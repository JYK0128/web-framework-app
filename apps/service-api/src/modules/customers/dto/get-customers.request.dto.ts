import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { hmac } from '@pkg/shared/server';
import { IsOptional, IsString } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

@ApiSchema({ name: 'GetCustomersRequest' })
export class GetCustomersRequestDto extends PageRequestDto<User> {
  @ApiPropertyOptional({ description: '고객 이름 또는 이메일 검색어' })
  @IsOptional()
  @IsString()
  override search?: string;

  override get searchFields(): (keyof User)[] {
    return ['name'];
  }

  override toFilterQuery(): ObjectQuery<User> {
    const filters = this.filters.toFilterQuery();
    const nameSearch = this.toSearchQuery();
    const email = this.search?.trim().toLowerCase();
    const searchQuery = email?.includes('@')
      ? { $or: [nameSearch, { emailHash: hmac(email, env.PII_HASH_KEY) }].filter(Boolean) }
      : nameSearch;
    const conditions = [filters, searchQuery].filter((query): query is ObjectQuery<User> => !!query && Object.keys(query).length > 0);
    return { $and: conditions };
  }
}
