import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { FilterableRequestDto } from '#/common/interfaces';
import { Term } from '#/entities/terms/term.entity';

export const TERM_HISTORY_SORT = ['publishedAt', 'createdAt', 'version', 'id'] as const;
export type TermHistorySortKey = (typeof TERM_HISTORY_SORT)[number];

export class GetTermHistoryFiltersDto extends FilterableRequestDto<Term> {
  @ApiPropertyOptional({ example: 'v2', description: '약관 버전' })
  @IsOptional()
  @IsString()
  version?: string;

  override toFilterQuery(): ObjectQuery<Term> {
    return {
      publishedAt: { $ne: null, $lte: new Date() },
      ...(this.version ? { version: this.version } : {}),
    };
  }
}
