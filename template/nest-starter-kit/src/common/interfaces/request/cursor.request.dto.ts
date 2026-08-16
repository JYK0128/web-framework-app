import type { ObjectQuery, QueryOrderMap } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { FilterableRequestDto } from './filterable.request.dto';
import { SearchableRequestDto } from './searchable.request.dto';
import { type SortKey } from './sortable.request.dto';

export type CursorRequestOptions<TEntity extends object> = {
  orderBy: QueryOrderMap<TEntity> | QueryOrderMap<TEntity>[]
  after?: string
  first: number
};

export abstract class CursorRequestDto<
  TEntity extends object,
  TSortKey extends string = SortKey<TEntity>,
> extends SearchableRequestDto<TEntity, TSortKey> {
  abstract filters: FilterableRequestDto<TEntity>;

  @ApiPropertyOptional({
    example: 'WzIwMjYtMDgtMDhUMTQ6MTE6NDYuMDM5WiJd',
    type: String,
    nullable: true,
    description: 'opaque cursor',
  })
  @IsOptional()
  @Type(() => String)
  @IsString()
  cursor: string | null = null;

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

  toCursorOptions(): CursorRequestOptions<TEntity> {
    return {
      orderBy: this.toOrderBy() as CursorRequestOptions<TEntity>['orderBy'],
      after: this.cursor ?? undefined,
      first: this.limit,
    };
  }
}
