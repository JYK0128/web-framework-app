import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, ValidateNested } from 'class-validator';

import { CursorRequestDto, SortDirection } from '#/common/interfaces';
import { Term } from '#/entities/terms/term.entity';

import { GetTermHistoryFiltersDto, TERM_HISTORY_SORT, type TermHistorySortKey } from './get-term-history.request.dto';

export class GetTermHistoryCursorRequestDto extends CursorRequestDto<Term, TermHistorySortKey> {
  @ApiPropertyOptional({ type: () => GetTermHistoryFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetTermHistoryFiltersDto)
  filters = new GetTermHistoryFiltersDto();

  @ApiPropertyOptional({ example: ['publishedAt', 'id'], isArray: true, enum: TERM_HISTORY_SORT })
  @IsOptional()
  @IsIn(TERM_HISTORY_SORT, { each: true })
  sort: TermHistorySortKey[] = ['publishedAt', 'id'];

  @ApiPropertyOptional({ example: ['desc', 'asc'], isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  direction: SortDirection[] = ['desc', 'asc'];
}
