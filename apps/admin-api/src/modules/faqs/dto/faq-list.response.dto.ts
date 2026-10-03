import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

import { FaqItemDto } from './faq-item.dto';

export class FaqListResponseDto extends PageResponseDto<FaqItemDto> {
  @ApiProperty({ type: [FaqItemDto] }) @Type(() => FaqItemDto) items!: FaqItemDto[];
  @ApiProperty({ type: [String] }) categories!: string[];
}
