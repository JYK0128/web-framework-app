import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-config/system-config.entity';

export class GetHolidaysRequestDto extends DtoType(SystemConfig) {
  @ApiPropertyOptional({ example: 2026, description: '조회 대상 연도 (생략 시 현재 연도)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '연도는 정수여야 합니다.' })
  @Min(2020)
  @Max(2050)
  year?: number;
}
