import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

import { ServiceAgreementMetadataDto } from '#/modules/service-term/agreement/service-agreement-metadata.dto';

export class CreateServiceTermRequestDto extends BaseDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  groupId!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  version!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  summary!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isNoticeRequired!: boolean;

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
