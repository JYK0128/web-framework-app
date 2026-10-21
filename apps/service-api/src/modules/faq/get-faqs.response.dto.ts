import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { FaqItemDto } from '~/modules/faq/faq-item.dto';

export class GetFaqsResponseDto extends PageResponseDto<FaqItemDto> {
  @ApiProperty({ type: [FaqItemDto] })
  @Type(() => FaqItemDto)
  items!: FaqItemDto[];

  @ApiProperty({ type: [String] })
  categories!: string[];
}
