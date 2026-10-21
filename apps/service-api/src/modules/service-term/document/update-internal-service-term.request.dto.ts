import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf, ValidateNested } from 'class-validator';

import { ServiceAgreementMetadataDto } from '~/modules/service-term/agreement/service-agreement-metadata.dto';

export class UpdateInternalServiceTermRequestDto extends BaseDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version?: string;

  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  reason?: string;

  @ApiPropertyOptional()
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  summary?: string;

  @ApiPropertyOptional({ type: Boolean })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isNoticeRequired?: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true, description: '게시 예정 시각 (null이면 예약 취소)' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string | null;

  @ApiPropertyOptional({ type: () => ServiceAgreementMetadataDto, nullable: true })
  @Type(() => ServiceAgreementMetadataDto)
  @IsOptional()
  @ValidateNested()
  metadata?: ServiceAgreementMetadataDto | null;
}
