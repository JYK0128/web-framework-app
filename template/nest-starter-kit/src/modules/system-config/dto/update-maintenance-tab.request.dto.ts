import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-config/system-config.entity';

import { OperatingMaintenanceDto } from './operating-hours.dto';

export class UpdateMaintenanceTabRequestDto extends DtoType(SystemConfig) {
  @ApiProperty({ type: OperatingMaintenanceDto })
  @ValidateNested()
  @Type(() => OperatingMaintenanceDto)
  maintenance!: OperatingMaintenanceDto;
}
