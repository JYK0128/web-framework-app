import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, ValidateNested } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { ToBoolean } from '#/common/decorators/to-boolean.decorator';
import { defineEnum } from '#/common/dto/enum';
import { FilterableRequestDto, PageRequestDto, SortDirection } from '#/common/interfaces';
import { RoleKey } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';

export const USER_SORT = ['name', 'email', 'role', 'twoFactorEnabled', 'createdAt', 'updatedAt', 'id'] as const;
export type UserSortKey = (typeof USER_SORT)[number];

export const UserFilterStatus = defineEnum('UserFilterStatus', {
  ACTIVE: 'active',
  BANNED: 'banned',
  DELETED: 'deleted',
} as const);
export type UserFilterStatus = (typeof UserFilterStatus)[keyof typeof UserFilterStatus];

export class GetUsersFiltersDto extends FilterableRequestDto<User> {
  @ApiEnumOptional({ enum: RoleKey })
  @IsOptional()
  @IsEnum(RoleKey)
  role?: RoleKey;

  @ApiPropertyOptional({ type: 'boolean' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @ApiEnumOptional({ enum: UserFilterStatus })
  @IsOptional()
  @IsEnum(UserFilterStatus)
  status?: UserFilterStatus;

  override toFilterQuery(): ObjectQuery<User> {
    const query: ObjectQuery<User> = {};
    if (this.role) {
      query.role = this.role;
    }
    if (this.twoFactorEnabled !== undefined) {
      query.twoFactorEnabled = this.twoFactorEnabled;
    }
    if (this.status === UserFilterStatus.BANNED) {
      query.banExpires = { $gt: new Date() };
    }
    else if (this.status === UserFilterStatus.DELETED) {
      query.deletedAt = { $ne: null };
    }
    else if (this.status === UserFilterStatus.ACTIVE) {
      query.deletedAt = null;
      query.$or = [{ banExpires: null }, { banExpires: { $lte: new Date() } }];
    }
    return query;
  }
}
export class GetUsersRequestDto extends PageRequestDto<User, UserSortKey> {
  override get searchFields(): (keyof User)[] {
    return ['name', 'email'];
  }

  @ApiPropertyOptional({ type: 'boolean', default: false })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  includeDeleted = false;

  @ApiPropertyOptional({ type: () => GetUsersFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetUsersFiltersDto)
  override filters = new GetUsersFiltersDto();

  @ApiPropertyOptional({ isArray: true, enum: USER_SORT })
  @IsOptional()
  @IsIn(USER_SORT, { each: true })
  override sort: UserSortKey[] = ['createdAt'];

  @ApiEnumOptional({ isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  override direction: SortDirection[] = [SortDirection.DESC];

  override toFilterQuery(): ObjectQuery<User> {
    const baseQuery = super.toFilterQuery();
    // 만약 status 필터가 직접 지정되지 않았고, includeDeleted가 false라면 삭제되지 않은 사용자만 조회
    if (!this.filters.status && !this.includeDeleted) {
      return {
        $and: [
          baseQuery,
          { deletedAt: null },
        ].filter((q): q is ObjectQuery<User> => !!q && Object.keys(q).length > 0),
      };
    }
    return baseQuery;
  }
}
