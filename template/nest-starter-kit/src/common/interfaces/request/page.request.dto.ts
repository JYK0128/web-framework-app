import type { ObjectQuery, QueryOrderMap } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { FilterableRequestDto } from './filterable.request.dto';
import { SearchableRequestDto } from './searchable.request.dto';
import { type SortKey } from './sortable.request.dto';

export type PageRequestOptions<TEntity extends object> = {
  orderBy?: QueryOrderMap<TEntity> | QueryOrderMap<TEntity>[]
  page: number
  limit: number
};

export abstract class PageRequestDto<
  TEntity extends object,
  TSortKey extends string = SortKey<TEntity>,
> extends SearchableRequestDto<TEntity, TSortKey> {
  abstract filters: FilterableRequestDto<TEntity>;

  @ApiPropertyOptional({ example: 1, type: Number, description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, type: Number, description: '페이지 크기', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

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

  toPageOptions(): PageRequestOptions<TEntity> {
    return {
      orderBy: this.toOrderBy() as PageRequestOptions<TEntity>['orderBy'],
      page: this.page,
      limit: this.limit,
    };
  }
}
