import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

import { ToNumber } from '#/common/decorators/to-number.decorator';

import { GetInquiriesRequestDto } from './get-inquiries.request.dto';

export class GetAdminInquiriesRequestDto extends GetInquiriesRequestDto {
  @ApiPropertyOptional({ type: 'string' })
  override search?: string;

  @ApiPropertyOptional({ type: 'number', default: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  override page = 1;
}
