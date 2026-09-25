import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { InquiryConfigDto } from '#/modules/system-config/dto/inquiry-config.dto';
import { MaintenanceConfigDto } from '#/modules/system-config/dto/maintenance-config.dto';
import { OperationConfigDto } from '#/modules/system-config/dto/operation-config.dto';

export class SupportRuntimeConfigResponseDto {
  @ApiProperty({ type: OperationConfigDto })
  @ValidateNested()
  @Type(() => OperationConfigDto)
  operation!: OperationConfigDto;

  @ApiProperty({ type: MaintenanceConfigDto })
  @ValidateNested()
  @Type(() => MaintenanceConfigDto)
  maintenance!: MaintenanceConfigDto;

  @ApiProperty({ type: InquiryConfigDto })
  @ValidateNested()
  @Type(() => InquiryConfigDto)
  inquiry!: InquiryConfigDto;
}
