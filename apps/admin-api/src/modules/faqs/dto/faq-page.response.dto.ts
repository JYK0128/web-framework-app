import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

import { FaqItemDto } from './faq-item.dto';

export class FaqPageResponseDto extends PageResponseDto<FaqItemDto> {
  @ApiProperty({ type: [FaqItemDto] }) @Type(() => FaqItemDto) items!: FaqItemDto[];
  @ApiProperty({ type: [String] }) categories!: string[];
}
