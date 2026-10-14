import { ApiProperty } from '@nestjs/swagger';
import { CursorResponseDto } from '@pkg/server-core/http/dto/response/cursor.response.dto';
import { Type } from 'class-transformer';

import { FaqItemDto } from '#/modules/faq/faq-item.dto';

export class GetPublicFaqsResponseDto extends CursorResponseDto<FaqItemDto> {
  @ApiProperty({ type: () => [FaqItemDto] })
  @Type(() => FaqItemDto)
  override items!: FaqItemDto[];

  @ApiProperty({ type: [String] })
  categories!: string[];
}
