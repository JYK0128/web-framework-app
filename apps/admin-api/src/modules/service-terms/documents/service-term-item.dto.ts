import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { Type } from 'class-transformer';

import { ServiceAgreementMetadataDto } from '#/modules/service-terms/agreements/service-agreement-metadata.dto';

export class ServiceTermItemDto extends BaseDto {
  @ApiProperty() id!: string;

  @ApiProperty() groupId!: string;

  @ApiProperty() title!: string;

  @ApiProperty() version!: string;

  @ApiProperty() content!: string;

  @ApiProperty() reason!: string;

  @ApiProperty() summary!: string;

  @ApiProperty({ type: Boolean, description: '약관 고지 여부' }) isNoticeRequired!: boolean;

  @ApiProperty() isRequired!: boolean;

  @ApiProperty() sortOrder!: number;

  @ApiProperty({ type: Boolean }) isDraft!: boolean;
  @ApiProperty({ type: Boolean }) isScheduled!: boolean;
  @ApiProperty() isPublished!: boolean;

  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) publishedAt!: Date | null;

  @ApiProperty({ format: 'date-time' }) createdAt!: Date;

  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;

  @ApiPropertyOptional({ type: () => ServiceAgreementMetadataDto, nullable: true })
  @Type(() => ServiceAgreementMetadataDto)
  metadata?: ServiceAgreementMetadataDto | null;
}
