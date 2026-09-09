import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { ALERT_LIST_DEFAULT_LIMIT } from '#/common/configs/application.config';
import { ToNumber } from '#/common/decorators/to-number.decorator';
import { ListRequestDto } from '#/common/interfaces';
import { Alert } from '#/entities/alerts/alert.entity';

export class GetAlertsRequestDto extends ListRequestDto<Alert> {
  @ApiPropertyOptional({ type: 'number', default: ALERT_LIST_DEFAULT_LIMIT, maximum: 100 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(100)
  override limit: number = ALERT_LIST_DEFAULT_LIMIT;
}
