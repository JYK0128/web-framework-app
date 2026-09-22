import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GetLogStatsRequestDto {
  @ApiPropertyOptional({ type: 'string', description: '통계 집계 시작 시점 (ISO-8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ type: 'string', description: '통계 집계 종료 시점 (ISO-8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
