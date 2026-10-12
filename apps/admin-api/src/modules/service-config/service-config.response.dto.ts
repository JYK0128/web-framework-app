import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { InquiryConfigDto } from '#/modules/service-config/inquiry/inquiry-config.dto';
import { MaintenanceConfigDto } from '#/modules/service-config/maintenance/maintenance-config.dto';
import { OperationConfigDto } from '#/modules/service-config/operation/operation-config.dto';

export class ServiceConfigResponseDto extends BaseDto {
  @ApiProperty({ type: OperationConfigDto }) @ValidateNested() @Type(() => OperationConfigDto) operation!: OperationConfigDto;
  @ApiProperty({ type: MaintenanceConfigDto }) @ValidateNested() @Type(() => MaintenanceConfigDto) maintenance!: MaintenanceConfigDto;
  @ApiProperty({ type: InquiryConfigDto }) @ValidateNested() @Type(() => InquiryConfigDto) inquiry!: InquiryConfigDto;
}
