import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

import { FilterableRequestDto, PageRequestDto, SortDirection } from '#/common/interfaces';
import { User } from '#/entities/auth/user.entity';

export const USER_SORT = ['name', 'email', 'role', 'twoFactorEnabled', 'createdAt', 'updatedAt', 'id'] as const;
export type UserSortKey = (typeof USER_SORT)[number];

export class GetUsersFiltersDto extends FilterableRequestDto<User> {
  @ApiPropertyOptional({ description: '이름 또는 이메일 검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '역할 필터 (admin, user 등)' })
  @IsOptional()
  @IsString()
  role?: string;

  toFilterQuery(): ObjectQuery<User> {
    const filters: ObjectQuery<User>[] = [];

    if (this.role) {
      filters.push({ role: this.role as User['role'] });
    }

    const search = this.search?.trim();
    if (search) {
      filters.push({
        $or: [
          { name: { $like: `%${search}%` } },
          { email: { $like: `%${search.toLowerCase()}%` } },
        ],
      });
    }

    return filters.length > 0 ? { $and: filters } : {};
  }
}

export class GetUsersRequestDto extends PageRequestDto<User, UserSortKey> {
  @ApiPropertyOptional({ type: () => GetUsersFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetUsersFiltersDto)
  filters = new GetUsersFiltersDto();

  @ApiPropertyOptional({ example: ['createdAt'], isArray: true, enum: USER_SORT })
  @IsOptional()
  @IsIn(USER_SORT, { each: true })
  sort: UserSortKey[] = ['createdAt'];

  @ApiPropertyOptional({ example: ['desc'], isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  direction: SortDirection[] = ['desc'];
}
