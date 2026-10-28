import type { QueryOrderMap } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { defineEnum } from '@pkg/shared/common';
import { IsArray, IsEnum, IsIn, IsOptional } from 'class-validator';

import { ApiEnumOptional } from '../../../decorators/api-enum.decorator';
import { ToArray } from '../../../decorators/to-array.decorator';
import type { QueryBaseClass, QueryOptions } from './query.shared';

export const SortDirection = defineEnum('SortDirection', {
  ASC: 'asc',
  DESC: 'desc',
} as const);
export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

export type SortDefinition = { fields: readonly string[], default?: readonly string[], direction?: SortDirection };

export type SortPart = { sort: string[], direction: SortDirection[] };

export function withSort<TEntity extends object>(Base: QueryBaseClass<TEntity>, definition: SortDefinition) {
  class SortQuery extends Base {
    @ApiPropertyOptional({ type: 'string', isArray: true, description: `Allowed fields: ${definition.fields.join(', ')}` })
    @IsOptional()
    @ToArray()
    @IsArray()
    @IsIn(definition.fields, { each: true })
    sort: string[] = [...(definition.default ?? [])];

    @ApiEnumOptional({ isArray: true, enum: SortDirection })
    @IsOptional()
    @ToArray()
    @IsEnum(SortDirection, { each: true })
    direction: SortDirection[] = [definition.direction ?? SortDirection.DESC];

    override toQuery(): QueryOptions<TEntity> {
      return { ...super.toQuery(), orderBy: Object.fromEntries(this.sort.map((field, index) => [field, this.direction[index] ?? SortDirection.ASC])) as QueryOrderMap<TEntity> };
    }
  }
  return SortQuery;
}
