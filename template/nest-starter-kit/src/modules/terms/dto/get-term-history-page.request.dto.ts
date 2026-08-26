import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, ValidateNested } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { PageRequestDto, SortDirection } from '#/common/interfaces';
import { Term } from '#/entities/terms/term.entity';

import { GetTermHistoryFiltersDto, TERM_HISTORY_SORT, type TermHistorySortKey } from './get-term-history.request.dto';

export class GetTermHistoryPageRequestDto extends PageRequestDto<Term, TermHistorySortKey> {
  override get searchFields(): (keyof Term)[] {
    return ['version', 'content'];
  }

  @ApiPropertyOptional({ type: () => GetTermHistoryFiltersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GetTermHistoryFiltersDto)
  override filters = new GetTermHistoryFiltersDto();

  @ApiPropertyOptional({ isArray: true, enum: TERM_HISTORY_SORT })
  @IsOptional()
  @IsIn(TERM_HISTORY_SORT, { each: true })
  override sort: TermHistorySortKey[] = ['publishedAt', 'id'];

  @ApiEnumOptional({ isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  override direction: SortDirection[] = ['desc', 'asc'];
}
