import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { ToNumber } from '#/core/http/decorators/to-number.decorator';
import { BaseDto } from '#/core/http/dto/base/base.dto';

export class GetHolidaysRequestDto extends BaseDto {
  @ApiPropertyOptional({ example: 2026, description: '조회 대상 연도 (생략 시 현재 연도)' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(2020)
  @Max(2050)
  year?: number;
}
