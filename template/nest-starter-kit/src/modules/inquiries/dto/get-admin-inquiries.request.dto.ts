import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

import { PAGINATION_DEFAULT_PAGE } from '#/common/configs/application.config';
import { ToNumber } from '#/common/decorators/to-number.decorator';

import { GetInquiriesRequestDto } from './get-inquiries.request.dto';

export class GetAdminInquiriesRequestDto extends GetInquiriesRequestDto {
  @ApiPropertyOptional({ type: 'string' })
  override search?: string;

  @ApiPropertyOptional({ type: 'number', default: PAGINATION_DEFAULT_PAGE })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  override page = PAGINATION_DEFAULT_PAGE;
}
