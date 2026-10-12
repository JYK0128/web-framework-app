import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { RecurringMaintenanceDto } from '#/modules/service-config/dto/recurring-maintenance.dto';
import { TemporaryMaintenanceDto } from '#/modules/service-config/dto/temporary-maintenance.dto';

export class MaintenanceConfigDto extends BaseDto {
  @ApiProperty({ type: TemporaryMaintenanceDto, description: '임시 점검 설정' })
  @ValidateNested()
  @Type(() => TemporaryMaintenanceDto)
  temporary!: TemporaryMaintenanceDto;

  @ApiProperty({ type: RecurringMaintenanceDto, description: '정기 점검 설정' })
  @ValidateNested()
  @Type(() => RecurringMaintenanceDto)
  recurring!: RecurringMaintenanceDto;
}
