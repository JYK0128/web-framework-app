import { ApiProperty } from '@nestjs/swagger';

import type { Term } from '#/entities/terms/term.entity';

export class AdminTermDto {
  constructor(term: Term) {
    this.id = term.id;
    this.code = term.termGroup.code;
    this.title = term.termGroup.title;
    this.isRequired = term.termGroup.isRequired;
    this.sortOrder = term.termGroup.sortOrder;
    this.version = term.version;
    this.content = term.content;
    this.publishedAt = term.publishedAt ?? null;
    this.isPublished = term.isPublished;
    this.isDraft = term.isDraft;
    this.createdAt = term.createdAt;
    this.updatedAt = term.updatedAt;
  }

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

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiProperty()
  isPublished!: boolean;

  @ApiProperty()
  isDraft!: boolean;

  @ApiProperty({ type: Date, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  updatedAt!: Date;
}
