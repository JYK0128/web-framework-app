import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { parseSearchTokens } from '@pkg/shared/common';
import { IsOptional, IsString } from 'class-validator';

import { combineQuery, type QueryBaseClass, type QueryOptions } from './query.shared';

function searchQuery<TEntity extends object>(search: string | undefined, fields: readonly (keyof TEntity)[]): ObjectQuery<TEntity> | null {
  const term = search?.trim();
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

export type SearchPart = { search?: string };

export function withSearch<TEntity extends object>(Base: QueryBaseClass<TEntity>, fields: readonly (keyof TEntity)[]) {
  class SearchQuery extends Base {
    @ApiPropertyOptional({ type: 'string' })
    @IsOptional()
    @IsString()
    search?: string;

    override toQuery(): QueryOptions<TEntity> {
      const query = super.toQuery();
      return { ...query, where: combineQuery(query.where, searchQuery(this.search, fields)) };
    }
  }
  return SearchQuery;
}
