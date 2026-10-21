import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { RecurringMaintenanceDto } from '~/modules/service-config/maintenance/recurring-maintenance.dto';
import { TemporaryMaintenanceDto } from '~/modules/service-config/maintenance/temporary-maintenance.dto';

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
