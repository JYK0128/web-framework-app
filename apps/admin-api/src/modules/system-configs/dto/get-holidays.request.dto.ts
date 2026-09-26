import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { ToNumber } from '#/common/decorators/to-number.decorator';

export class GetHolidaysRequestDto {
  @ApiPropertyOptional({ example: 2026, description: '조회 대상 연도 (생략 시 현재 연도)' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(2020)
  @Max(2050)
  year?: number;
}
