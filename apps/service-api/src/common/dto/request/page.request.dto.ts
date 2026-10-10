import type { QueryOrderMap } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

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
  @ApiPropertyOptional({ type: 'number', default: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: 'number', default: 20 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  limit = 20;

  toPageOptions(): PageRequestOptions<TEntity> {
    return {
      orderBy: this.toOrderBy() as PageRequestOptions<TEntity>['orderBy'],
      page: this.page,
      limit: this.limit,
    };
  }
}
