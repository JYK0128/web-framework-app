import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetActivityLogsRequestDto {
  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ type: 'number' })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  statusCode?: number;

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

  @ApiPropertyOptional({ type: 'number', default: 30 })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 30))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;
}
