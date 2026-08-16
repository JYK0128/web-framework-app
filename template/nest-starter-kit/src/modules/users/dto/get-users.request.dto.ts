import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, ValidateNested } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { FilterableRequestDto, PageRequestDto, SortDirection } from '#/common/interfaces';
import { RoleName } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';

export const USER_SORT = ['name', 'email', 'role', 'twoFactorEnabled', 'createdAt', 'updatedAt', 'id'] as const;
export type UserSortKey = (typeof USER_SORT)[number];

export class GetUsersFiltersDto extends FilterableRequestDto<User> {
  @ApiEnumOptional({ description: '역할 필터', enum: RoleName })
  @IsOptional()
  @IsEnum(RoleName)
  role?: RoleName;

  toFilterQuery(): ObjectQuery<User> {
    if (this.role) {
      return { role: this.role };
    }
    return {};
  }
}

export class GetUsersRequestDto extends PageRequestDto<User, UserSortKey> {
  override get searchFields(): (keyof User)[] {
    return ['name', 'email'];
  }

  @ApiPropertyOptional({ type: Boolean, description: '삭제된 사용자 포함 여부', default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeDeleted = false;

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
