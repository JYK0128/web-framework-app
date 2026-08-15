import { ApiProperty } from '@nestjs/swagger';

import { FaqItemDto } from './faq-item.dto';

export class GetFaqsResponseDto {
  @ApiProperty({ type: () => [FaqItemDto] })
  items!: FaqItemDto[];

  @ApiProperty({ type: () => [String] })
  categories!: string[];
}
