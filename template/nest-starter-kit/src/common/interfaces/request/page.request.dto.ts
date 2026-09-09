import type { QueryOrderMap } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE } from '#/common/configs/application.config';
import { ToNumber } from '#/common/decorators/to-number.decorator';
import { BaseEntity } from '#/entities/common/base.entity';

import { SearchableRequestDto } from './searchable.request.dto';
import { type SortKey } from './sortable.request.dto';

export type PageRequestOptions<TEntity extends BaseEntity> = {
  orderBy?: QueryOrderMap<TEntity> | QueryOrderMap<TEntity>[]
  page: number
  limit: number
};
export class PageRequestDto<TEntity extends BaseEntity, TSortKey extends string = SortKey<TEntity>> extends SearchableRequestDto<TEntity, TSortKey> {
  @ApiPropertyOptional({ type: 'number', default: PAGINATION_DEFAULT_PAGE })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  page = PAGINATION_DEFAULT_PAGE;

  @ApiPropertyOptional({ type: 'number', default: PAGINATION_DEFAULT_LIMIT, maximum: 100 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = PAGINATION_DEFAULT_LIMIT;

  toPageOptions(): PageRequestOptions<TEntity> {
    return {
      orderBy: this.toOrderBy() as PageRequestOptions<TEntity>['orderBy'],
      page: this.page,
      limit: this.limit,
    };
  }
}
