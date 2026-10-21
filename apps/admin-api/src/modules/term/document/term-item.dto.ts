import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base';

import { Term } from '~/core/database/entities/terms';
import { AgreementMetadataDto } from '~/modules/term/agreement/agreement-metadata.dto';

export class TermItemDto extends EntityDto(Term) {
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

  @ApiProperty({ type: Boolean })
  isScheduled!: boolean;

  @ApiProperty()
  isDraft!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static override parseEntity(term: Term): TermItemDto {
    return this.parse({
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
      isScheduled: term.isScheduled,
      isDraft: term.isDraft,
      createdAt: term.createdAt,
      updatedAt: term.updatedAt,
    });
  }
}
