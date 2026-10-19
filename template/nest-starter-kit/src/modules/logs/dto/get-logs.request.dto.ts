import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { LOG_QUERY_DEFAULT_LIMIT } from '#/common/configs/runtime.config';
import { ToNumber } from '#/common/decorators/to-number.decorator';

export class GetLogsRequestDto {
  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ oneOf: [{ type: 'string' }, { type: 'number' }] })
  @IsOptional()
  statusCode?: string | number;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ type: 'number', default: LOG_QUERY_DEFAULT_LIMIT })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = LOG_QUERY_DEFAULT_LIMIT;
}
