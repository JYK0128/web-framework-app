import { Type } from 'class-transformer';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

import { FaqItemDto } from './faq-item.dto';

@ApiSchema({ name: 'FaqPageResponse' })
export class FaqPageResponseDto extends PageResponseDto<FaqItemDto> {
  @ApiProperty({ type: [FaqItemDto] })
  @Type(() => FaqItemDto) items!: FaqItemDto[];

  @ApiProperty({ type: [String] })
  categories!: string[];
}
