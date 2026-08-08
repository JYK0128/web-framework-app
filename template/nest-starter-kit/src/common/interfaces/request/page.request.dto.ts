import type { QueryOrderMap } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { FilterableRequestDto } from './filterable.request.dto';
import { SortableRequestDto, type SortKey } from './sortable.request.dto';

export type PageRequestOptions<TEntity extends object> = {
  orderBy?: QueryOrderMap<TEntity> | QueryOrderMap<TEntity>[]
  page: number
  limit: number
};

export abstract class PageRequestDto<
  TEntity extends object,
  TSortKey extends string = SortKey<TEntity>,
> extends SortableRequestDto<TEntity, TSortKey> {
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

  toFilterQuery() {
    return this.filters.toFilterQuery();
  }

  toPageOptions(): PageRequestOptions<TEntity> {
    return {
      orderBy: this.toOrderBy() as PageRequestOptions<TEntity>['orderBy'],
      page: this.page,
      limit: this.limit,
    };
  }
}
