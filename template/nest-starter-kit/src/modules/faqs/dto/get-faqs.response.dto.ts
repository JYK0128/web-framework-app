import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces';

import { FaqItemDto } from './faq-item.dto';

export class GetFaqsResponseDto extends ListResponseDto<FaqItemDto> {
  @ApiProperty({ type: () => [FaqItemDto] })
  @Type(() => FaqItemDto)
  override items!: FaqItemDto[];

  @ApiProperty({ type: () => [String] })
  categories!: string[];
}
