import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, ValidateIf, ValidateNested } from 'class-validator';

import { AgreementMetadataDto } from '~/modules/term/agreement/agreement-metadata.dto';

export class UpdateTermRequestDto extends BaseDto {
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

  @ApiPropertyOptional({ type: Boolean, description: '약관 고지 여부' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isNoticeRequired?: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true, description: '게시 예정 시각 (null이면 예약 취소)' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string | null;

  @ApiPropertyOptional({ type: () => AgreementMetadataDto, nullable: true })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AgreementMetadataDto)
  metadata?: AgreementMetadataDto | null;
}
