import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, ValidateNested } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { ToBoolean } from '#/common/decorators/to-boolean.decorator';
import { FilterableRequestDto, PageRequestDto } from '#/common/interfaces';
import { RoleName } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';

export class GetUsersFiltersDto extends FilterableRequestDto<User> {
  @ApiEnumOptional({ enum: RoleName })
  @IsOptional()
  @IsEnum(RoleName)
  role?: RoleName;

  override toFilterQuery(): ObjectQuery<User> {
    if (this.role) {
      return { role: this.role };
    }
    return {};
  }
}
export class GetUsersRequestDto extends PageRequestDto<User> {
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
}
