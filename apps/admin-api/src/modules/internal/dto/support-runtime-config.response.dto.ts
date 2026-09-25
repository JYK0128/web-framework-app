import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { InquiryConfigDto } from '#/modules/system-config/dto/inquiry-config.dto';
import { MaintenanceConfigDto } from '#/modules/system-config/dto/maintenance-config.dto';
import { OperationConfigDto } from '#/modules/system-config/dto/operation-config.dto';

export class SupportRuntimeConfigResponseDto {
  @ApiProperty({ type: OperationConfigDto })
  @ValidateNested()
  @Type(() => OperationConfigDto)
  operation!: OperationConfigDto;

  @ApiPropertyOptional({ type: MaintenanceConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MaintenanceConfigDto)
  maintenance?: MaintenanceConfigDto;

  @ApiProperty({ type: InquiryConfigDto })
  @ValidateNested()
  @Type(() => InquiryConfigDto)
  inquiry!: InquiryConfigDto;
}
