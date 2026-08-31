import { ApiProperty } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces';

import { FaqItemDto } from './faq-item.dto';

export class GetAdminFaqsResponseDto extends PageResponseDto<FaqItemDto> {
  @ApiProperty({ type: () => [FaqItemDto] })
  override items!: FaqItemDto[];
}
