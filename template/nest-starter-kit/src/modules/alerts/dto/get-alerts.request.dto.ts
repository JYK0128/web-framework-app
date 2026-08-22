import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Alert } from '#/entities/alerts/alert.entity';

export class GetAlertsRequestDto extends DtoType(Alert) {
  @ApiPropertyOptional({ type: 'number', default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}
