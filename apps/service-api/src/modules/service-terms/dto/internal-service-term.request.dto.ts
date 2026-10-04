import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { ServiceAgreementMetadataDto } from './service-agreement-metadata.dto';

@ApiSchema({ name: 'InternalServiceTermRequest' })
export class InternalServiceTermRequestDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() groupId!: string;
  @ApiProperty() @IsString() @IsNotEmpty() version!: string;
  @ApiProperty() @IsString() @IsNotEmpty() content!: string;
  @ApiProperty() @IsString() @IsNotEmpty() reason!: string;
  @ApiProperty() @IsString() @IsNotEmpty() summary!: string;
  @ApiProperty({ type: Boolean, description: '약관 고지 여부' }) @IsBoolean() isNoticeRequired!: boolean;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true, description: '게시 예정 시각 (null이면 예약 취소)' }) @IsOptional() @IsDateString() publishedAt?: string | null;
  @ApiPropertyOptional({ type: () => ServiceAgreementMetadataDto, nullable: true })
  @Type(() => ServiceAgreementMetadataDto)
  @IsOptional()
  @ValidateNested()
  metadata?: ServiceAgreementMetadataDto | null;
}
