import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { ALERT_LIST_DEFAULT_LIMIT } from '#/common/configs/application.config';
import { ToNumber } from '#/common/decorators/to-number.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Alert } from '#/entities/alerts/alert.entity';

export class GetAlertsRequestDto extends DtoType(Alert) {
  @ApiPropertyOptional({ type: 'number', default: ALERT_LIST_DEFAULT_LIMIT, maximum: 100 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = ALERT_LIST_DEFAULT_LIMIT;
}
