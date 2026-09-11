import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces';

import { TermItemDto } from './term-item.dto';

export class GetTermHistoryPageResponseDto extends PageResponseDto<TermItemDto> {
  @ApiProperty({ type: () => [TermItemDto] })
  @Type(() => TermItemDto)
  override items!: TermItemDto[];
}
