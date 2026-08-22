import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { GetInquiriesRequestDto } from './get-inquiries.request.dto';

export class GetAdminInquiriesRequestDto extends GetInquiriesRequestDto {
  @ApiPropertyOptional({ type: 'string' })
  override search?: string;

  @Type(() => Number)
  override page = 1;
}
