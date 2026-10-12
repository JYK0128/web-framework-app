import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { Term } from '#/core/database/entities/terms';
import { EntityDto } from '#/core/http/dto/base/entity.dto';

import { ServiceAgreementMetadataDto } from './agreements/service-agreement-metadata.dto';

@ApiSchema({ name: 'InternalServiceTermItem' })
export class InternalServiceTermItemDto extends EntityDto(Term) {
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
  @ApiProperty() isPublished!: boolean;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) publishedAt!: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
  @ApiPropertyOptional({ type: () => ServiceAgreementMetadataDto, nullable: true })
  @Type(() => ServiceAgreementMetadataDto)
  metadata?: ServiceAgreementMetadataDto | null;

  static override parseEntity(term: Term): InternalServiceTermItemDto {
    return this.parse({ id: term.id, groupId: term.termGroup.id, title: term.termGroup.title, version: term.version, content: term.content, reason: term.reason, summary: term.summary, isNoticeRequired: term.isNoticeRequired, isRequired: term.termGroup.isRequired, sortOrder: term.termGroup.sortOrder, isPublished: term.isPublished, publishedAt: term.publishedAt, createdAt: term.createdAt, updatedAt: term.updatedAt, metadata: ServiceAgreementMetadataDto.parseMetadata(term.metadata) });
  }
}
