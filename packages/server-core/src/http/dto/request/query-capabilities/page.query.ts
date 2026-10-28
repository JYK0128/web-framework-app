import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

import { ToNumber } from '../../../decorators/to-number.decorator';
import type { QueryBaseClass, QueryOptions } from './query.shared';

export type PagePart = { page: number, limit: number };

export function withPage<TEntity extends object>(Base: QueryBaseClass<TEntity>, definition: { defaultLimit?: number }) {
  class PageQuery extends Base {
    @ApiPropertyOptional({ type: 'number', default: 1 })
    @IsOptional() @ToNumber() @IsInt() @Min(1)
    page = 1;

    @ApiPropertyOptional({ type: 'number', default: definition.defaultLimit ?? 20 })
    @IsOptional() @ToNumber() @IsInt() @Min(1)
    limit = definition.defaultLimit ?? 20;

    override toQuery(): QueryOptions<TEntity> {
      return { ...super.toQuery(), page: this.page, limit: this.limit };
    }
  }
  return PageQuery;
}
