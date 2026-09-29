import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

import { FaqItemDto } from './faq-item.dto';

@ApiSchema({ name: 'FaqListResponse' })
export class FaqListResponseDto extends PageResponseDto<FaqItemDto> {
  @ApiProperty({ type: [FaqItemDto] })
  items!: FaqItemDto[];

  @ApiProperty({ type: [String] })
  categories!: string[];
}
