import type { QueryOrderMap } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { PAGINATION_DEFAULT_LIMIT } from '#/common/configs/application.config';
import { ToNumber } from '#/common/decorators/to-number.decorator';
import { ToString } from '#/common/decorators/to-string.decorator';
import { BaseEntity } from '#/entities/common/base.entity';

import { SearchableRequestDto } from './searchable.request.dto';
import { type SortKey } from './sortable.request.dto';

export type CursorRequestOptions<TEntity extends BaseEntity> = {
  orderBy: QueryOrderMap<TEntity> | QueryOrderMap<TEntity>[]
  after?: string
  first: number
};
export class CursorRequestDto<TEntity extends BaseEntity, TSortKey extends string = SortKey<TEntity>> extends SearchableRequestDto<TEntity, TSortKey> {
  @ApiPropertyOptional({ type: 'string', nullable: true })
  @IsOptional()
  @ToString()
  @IsString()
  cursor: string | null = null;

  @ApiPropertyOptional({ type: 'number', default: PAGINATION_DEFAULT_LIMIT, maximum: 100 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = PAGINATION_DEFAULT_LIMIT;

  toCursorOptions(): CursorRequestOptions<TEntity> {
    return {
      orderBy: this.toOrderBy() as CursorRequestOptions<TEntity>['orderBy'],
      after: this.cursor ?? undefined,
      first: this.limit,
    };
  }
}
