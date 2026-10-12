import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { InquiryConfigDto } from '#/modules/service-config/dto/inquiry/inquiry-config.dto';
import { MaintenanceConfigDto } from '#/modules/service-config/dto/maintenance-config.dto';
import { OperationConfigDto } from '#/modules/service-config/dto/operation-config.dto';

export class UpdateServiceConfigRequestDto extends BaseDto {
  @ApiPropertyOptional({ type: OperationConfigDto }) @IsOptional() @ValidateNested() @Type(() => OperationConfigDto) operation?: OperationConfigDto;
  @ApiPropertyOptional({ type: MaintenanceConfigDto }) @IsOptional() @ValidateNested() @Type(() => MaintenanceConfigDto) maintenance?: MaintenanceConfigDto;
  @ApiPropertyOptional({ type: InquiryConfigDto }) @IsOptional() @ValidateNested() @Type(() => InquiryConfigDto) inquiry?: InquiryConfigDto;
}
