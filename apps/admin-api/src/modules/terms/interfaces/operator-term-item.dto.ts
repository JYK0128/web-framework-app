import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EntityDto } from '#/common/interfaces/base/entity.dto';
import { Term } from '#/entities/terms/term.entity';

import { AgreementMetadataDto } from './term-agreement-item.dto';

export class OperatorTermItemDto extends EntityDto(Term) {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  groupId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  isRequired!: boolean;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty({ type: Boolean, description: '약관 고지 여부' })
  isNoticeRequired!: boolean;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiPropertyOptional({ type: () => AgreementMetadataDto, nullable: true })
  metadata?: AgreementMetadataDto | null;

  @ApiProperty()
  isPublished!: boolean;

  @ApiProperty()
  isDraft!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static override from(term: Term): OperatorTermItemDto {
    return OperatorTermItemDto.fromPlain({
      id: term.id,
      groupId: term.termGroup.id,
      title: term.termGroup.title,
      isRequired: term.termGroup.isRequired,
      sortOrder: term.termGroup.sortOrder,
      version: term.version,
      content: term.content,
      reason: term.reason,
      summary: term.summary,
      isNoticeRequired: term.isNoticeRequired,
      publishedAt: term.publishedAt,
      metadata: term.metadata,
      isPublished: term.isPublished,
      isDraft: term.isDraft,
      createdAt: term.createdAt,
      updatedAt: term.updatedAt,
    });
  }
}
