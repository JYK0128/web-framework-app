import type { QueryOrderMap } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

import { ToNumber } from '../../decorators/to-number.decorator';
import { SearchableRequestDto } from './searchable.request.dto';
import { type SortKey } from './sortable.request.dto';

export type ListRequestOptions<TEntity extends object> = {
  orderBy?: QueryOrderMap<TEntity> | QueryOrderMap<TEntity>[]
  offset?: number
  limit?: number
};
export class ListRequestDto<TEntity extends object, TSortKey extends string = SortKey<TEntity>> extends SearchableRequestDto<TEntity, TSortKey> {
  @ApiPropertyOptional({ type: 'number' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({ type: 'number', nullable: true })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  limit?: number;

  toListOptions(): ListRequestOptions<TEntity> {
    return {
      orderBy: this.toOrderBy() as ListRequestOptions<TEntity>['orderBy'],
      offset: this.offset,
      limit: this.limit,
    };
  }
}
