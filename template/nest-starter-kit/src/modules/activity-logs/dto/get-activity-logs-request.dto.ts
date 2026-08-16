import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetActivityLogsRequestDto {
  @ApiPropertyOptional({ description: '검색어 (URL, 액션, 유저, 에러 등)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'HTTP 메소드 필터 (GET, POST 등)' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ description: 'HTTP 상태 코드 필터 (200, 404, 500 등)' })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  statusCode?: number;

  @ApiPropertyOptional({ description: '시작 일시 (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '종료 일시 (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '커서 (Base64 인코딩된 시간+ID)' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: '페이지당 조회 건수 (기본 30, 최대 100)', default: 30 })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 30))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;
}
