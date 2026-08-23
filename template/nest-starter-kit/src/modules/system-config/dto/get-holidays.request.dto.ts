import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetHolidaysRequestDto {
  @ApiPropertyOptional({ example: 2026, description: '조회 대상 연도 (생략 시 현재 연도)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '연도는 정수여야 합니다.' })
  @Min(2020)
  @Max(2050)
  year?: number;
}
