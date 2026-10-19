import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces';

import { FaqItemDto } from './faq-item.dto';

export class GetAdminFaqsResponseDto extends PageResponseDto<FaqItemDto> {
  @ApiProperty({ type: () => [FaqItemDto] })
  @Type(() => FaqItemDto)
  override items!: FaqItemDto[];
}
