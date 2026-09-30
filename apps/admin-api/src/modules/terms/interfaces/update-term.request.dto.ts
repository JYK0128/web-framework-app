import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

import { AgreementMetadataDto } from './term-agreement-item.dto';

export class UpdateTermRequestDto {
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  summary?: string;

  @ApiPropertyOptional({ type: Boolean, description: '약관 고지 여부' })
  @IsOptional()
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
