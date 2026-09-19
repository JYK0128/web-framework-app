import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';
import { Term } from '#/entities/terms/term.entity';

export class AdminTermItemDto extends BaseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

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

  @ApiProperty({ nullable: true })
  publishedAt!: Date | null;

  @ApiProperty()
  isPublished!: boolean;

  @ApiProperty()
  isDraft!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static from(term: Term): AdminTermItemDto {
    return AdminTermItemDto.fromPlain({
      id: term.id,
      code: term.termGroup.code,
      title: term.termGroup.title,
      isRequired: term.termGroup.isRequired,
      sortOrder: term.termGroup.sortOrder,
      version: term.version,
      content: term.content,
      publishedAt: term.publishedAt,
      isPublished: term.isPublished,
      isDraft: term.isDraft,
      createdAt: term.createdAt,
      updatedAt: term.updatedAt,
    });
  }
}
