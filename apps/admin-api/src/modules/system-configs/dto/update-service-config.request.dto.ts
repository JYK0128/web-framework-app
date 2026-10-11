import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { InquiryConfigDto } from '#/modules/system-configs/dto/inquiry/inquiry-config.dto';
import { MaintenanceConfigDto } from '#/modules/system-configs/dto/maintenance-config.dto';
import { OperationConfigDto } from '#/modules/system-configs/dto/operation-config.dto';

export class UpdateServiceConfigRequestDto extends BaseDto {
  @ApiPropertyOptional({ type: OperationConfigDto }) @IsOptional() @ValidateNested() @Type(() => OperationConfigDto) operation?: OperationConfigDto;
  @ApiPropertyOptional({ type: MaintenanceConfigDto }) @IsOptional() @ValidateNested() @Type(() => MaintenanceConfigDto) maintenance?: MaintenanceConfigDto;
  @ApiPropertyOptional({ type: InquiryConfigDto }) @IsOptional() @ValidateNested() @Type(() => InquiryConfigDto) inquiry?: InquiryConfigDto;
}
