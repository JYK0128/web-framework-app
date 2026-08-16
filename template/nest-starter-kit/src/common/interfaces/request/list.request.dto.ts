import type { ObjectQuery, QueryOrderMap } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { FilterableRequestDto } from './filterable.request.dto';
import { SearchableRequestDto } from './searchable.request.dto';
import { type SortKey } from './sortable.request.dto';

export type ListRequestOptions<TEntity extends object> = {
  orderBy?: QueryOrderMap<TEntity> | QueryOrderMap<TEntity>[]
  offset?: number
  limit?: number
};

export abstract class ListRequestDto<
  TEntity extends object,
  TSortKey extends string = SortKey<TEntity>,
> extends SearchableRequestDto<TEntity, TSortKey> {
  abstract filters: FilterableRequestDto<TEntity>;

  @ApiPropertyOptional({ type: Number, description: '오프셋' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ type: Number, nullable: true, description: '최대 항목 수', maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  toFilterQuery(): ObjectQuery<TEntity> {
    const filters = this.filters.toFilterQuery();
    const searchQuery = this.toSearchQuery();

    if (searchQuery) {
      return Object.keys(filters).length > 0
        ? ({ $and: [filters, searchQuery] } as ObjectQuery<TEntity>)
        : searchQuery;
    }

    return filters;
  }

  toListOptions(): ListRequestOptions<TEntity> {
    return {
      orderBy: this.toOrderBy() as ListRequestOptions<TEntity>['orderBy'],
      offset: this.offset,
      limit: this.limit,
    };
  }
}
