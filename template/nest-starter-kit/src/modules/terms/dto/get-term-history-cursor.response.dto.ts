import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { CursorResponseDto } from '#/common/interfaces';

import { TermItemDto } from './term-item.dto';

export class GetTermHistoryCursorResponseDto extends CursorResponseDto<TermItemDto> {
  @ApiProperty({ type: () => [TermItemDto] })
  @Type(() => TermItemDto)
  override items!: TermItemDto[];
}
