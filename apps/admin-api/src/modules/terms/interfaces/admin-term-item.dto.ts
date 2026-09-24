import { ApiProperty } from '@nestjs/swagger';

import { EntityResponseDto } from '#/common/interfaces/base';
import { Term } from '#/entities/terms/term.entity';

export class AdminTermItemDto extends EntityResponseDto(Term) {
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

  @ApiProperty()
  isPublished!: boolean;

  @ApiProperty()
  isDraft!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static override from(term: Term): AdminTermItemDto {
    return AdminTermItemDto.fromPlain({
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
      isPublished: term.isPublished,
      isDraft: term.isDraft,
      createdAt: term.createdAt,
      updatedAt: term.updatedAt,
    });
  }
}
