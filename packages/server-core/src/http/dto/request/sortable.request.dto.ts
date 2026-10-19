import { ApiPropertyOptional } from '@nestjs/swagger';
import { defineEnum } from '@pkg/shared/common';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ApiEnumOptional } from '../../decorators/api-enum.decorator';
import { FilterableRequestDto } from './filterable.request.dto';

export const SortDirection = defineEnum('SortDirection', {
  ASC: 'asc',
  DESC: 'desc',
} as const);
export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];
export type SortKey<TEntity extends object> = Extract<keyof TEntity, string>;
export abstract class SortableRequestDto<TEntity extends object, TSortKey extends string = SortKey<TEntity>> extends FilterableRequestDto<TEntity> {
  @ApiPropertyOptional({ isArray: true })
  @IsOptional()
  @IsString({ each: true })
  sort: TSortKey[] = ['createdAt' as TSortKey];

  @ApiEnumOptional({ isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  direction: SortDirection[] = [SortDirection.DESC];

  protected toOrderBy(): Record<string, SortDirection> {
    return this.sort.reduce<Record<string, SortDirection>>((orderBy, field, index) => {
      orderBy[field] = this.direction[index] ?? SortDirection.ASC;
      return orderBy;
    }, {});
  }
}
