import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE, PAGINATION_MAX_LIMIT } from '#/app.config';
import { ToNumber } from '#/common/decorators/to-number.decorator';

export class GetCustomersRequestDto {
  @ApiPropertyOptional({ type: Number, default: PAGINATION_DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  page = PAGINATION_DEFAULT_PAGE;

  @ApiPropertyOptional({ type: Number, default: PAGINATION_DEFAULT_LIMIT, minimum: 1, maximum: PAGINATION_MAX_LIMIT })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(PAGINATION_MAX_LIMIT)
  limit = PAGINATION_DEFAULT_LIMIT;

  @ApiPropertyOptional({ description: '고객 이름 또는 이메일 검색어' })
  @IsOptional()
  @IsString()
  search?: string;
}
