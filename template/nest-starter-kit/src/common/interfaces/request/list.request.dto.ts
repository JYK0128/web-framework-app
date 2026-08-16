import type { QueryOrderMap } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { BaseEntity } from '#/entities/common/base.entity';

import { SearchableRequestDto } from './searchable.request.dto';
import { type SortKey } from './sortable.request.dto';

export type ListRequestOptions<TEntity extends BaseEntity> = {
  orderBy?: QueryOrderMap<TEntity> | QueryOrderMap<TEntity>[]
  offset?: number
  limit?: number
};

export class ListRequestDto<
  TEntity extends BaseEntity,
  TSortKey extends string = SortKey<TEntity>,
> extends SearchableRequestDto<TEntity, TSortKey> {
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

  toListOptions(): ListRequestOptions<TEntity> {
    return {
      orderBy: this.toOrderBy() as ListRequestOptions<TEntity>['orderBy'],
      offset: this.offset,
      limit: this.limit,
    };
  }
}
