import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { GetCustomersRequestDto } from '#/modules/customers/dto';

export class GetFaqsRequestDto extends GetCustomersRequestDto {
  @ApiPropertyOptional({ description: 'FAQ 카테고리' })
  @IsOptional()
  @IsString()
  category?: string;
}
