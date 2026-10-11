import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { InquiryConfigDto } from '#/modules/system-configs/dto/inquiry/inquiry-config.dto';
import { MaintenanceConfigDto } from '#/modules/system-configs/dto/maintenance-config.dto';
import { OperationConfigDto } from '#/modules/system-configs/dto/operation-config.dto';

export class ServiceConfigResponseDto extends BaseDto {
  @ApiProperty({ type: OperationConfigDto }) @ValidateNested() @Type(() => OperationConfigDto) operation!: OperationConfigDto;
  @ApiProperty({ type: MaintenanceConfigDto }) @ValidateNested() @Type(() => MaintenanceConfigDto) maintenance!: MaintenanceConfigDto;
  @ApiProperty({ type: InquiryConfigDto }) @ValidateNested() @Type(() => InquiryConfigDto) inquiry!: InquiryConfigDto;
}
