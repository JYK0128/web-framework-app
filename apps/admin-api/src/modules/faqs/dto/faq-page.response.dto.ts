import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';
import { FaqItemDto } from '#/modules/faqs/dto/faq-item.dto';

export class FaqPageResponseDto extends PageResponseDto<FaqItemDto> {
  @ApiProperty({ type: [FaqItemDto] }) @Type(() => FaqItemDto) items!: FaqItemDto[];
  @ApiProperty({ type: [String] }) categories!: string[];
}
