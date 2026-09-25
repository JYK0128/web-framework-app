import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { CursorResponseDto } from '#/common/interfaces/response/cursor.response.dto';

import { FaqItemDto } from './faq-item.dto';

export class FaqCursorResponseDto extends CursorResponseDto<FaqItemDto> {
  @ApiProperty({ type: () => [FaqItemDto] })
  @Type(() => FaqItemDto)
  override items!: FaqItemDto[];

  @ApiProperty({ type: [String] })
  categories!: string[];
}
