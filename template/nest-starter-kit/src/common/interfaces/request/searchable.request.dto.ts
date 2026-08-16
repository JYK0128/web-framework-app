import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { parseSearchTokens } from '@pkg/shared/common';
import { IsOptional, IsString } from 'class-validator';

import { SortableRequestDto, type SortKey } from './sortable.request.dto';

export abstract class SearchableRequestDto<
  TEntity extends object,
  TSortKey extends string = SortKey<TEntity>,
> extends SortableRequestDto<TEntity, TSortKey> {
  @ApiPropertyOptional({ description: '통합 검색어 (일반 검색, 초성 검색, 영타 오타 자동 변환 지원)' })
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

    const { original, qwertyConverted, choseongRegex } = parseSearchTokens(term);
    const matchers: Record<string, string>[] = [{ $like: `%${original}%` }];

    if (qwertyConverted && qwertyConverted !== original) {
      matchers.push({ $like: `%${qwertyConverted}%` });
    }

    if (choseongRegex) {
      matchers.push({ $re: choseongRegex });
    }

    return {
      $or: fields.flatMap((field) => matchers.map((matcher) => ({ [field]: matcher }))),
    } as ObjectQuery<TEntity>;
  }
}
