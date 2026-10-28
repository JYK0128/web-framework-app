import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

import { ToNumber } from '../../../decorators/to-number.decorator';
import { ToString } from '../../../decorators/to-string.decorator';
import type { QueryBaseClass, QueryOptions } from './query.shared';

export type CursorPart = { cursor: string | null, limit: number };

export function withCursor<TEntity extends object>(Base: QueryBaseClass<TEntity>, definition: { defaultLimit?: number }) {
  class CursorQuery extends Base {
    @ApiPropertyOptional({ type: 'string', nullable: true })
    @IsOptional() @ToString() @IsString()
    cursor: string | null = null;

    @ApiPropertyOptional({ type: 'number', default: definition.defaultLimit ?? 20 })
    @IsOptional() @ToNumber() @IsInt() @Min(1)
    limit = definition.defaultLimit ?? 20;

    override toQuery(): QueryOptions<TEntity> {
      return { ...super.toQuery(), after: this.cursor ?? undefined, first: this.limit };
    }
  }
  return CursorQuery;
}
