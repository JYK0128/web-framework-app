import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { SortableRequestDto, type SortKey } from './sortable.request.dto';

export abstract class SearchableRequestDto<
  TEntity extends object,
  TSortKey extends string = SortKey<TEntity>,
> extends SortableRequestDto<TEntity, TSortKey> {
  @ApiPropertyOptional({ description: '통합 검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  /** 검색 대상 엔티티 필드 목록 */
  get searchFields(): (keyof TEntity)[] {
    return [];
  }

  toSearchQuery(): ObjectQuery<TEntity> | null {
    const term = this.search?.trim();
    const fields = this.searchFields;

    if (!term || fields.length === 0) {
      return null;
    }

    return {
      $or: fields.map((field) => ({
        [field]: { $like: `%${term}%` },
      })),
    } as ObjectQuery<TEntity>;
  }
}
