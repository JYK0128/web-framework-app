import { ApiProperty } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';

export class AdminTermDto extends DtoType(Term, TermGroup) {
  constructor(term: Term) {
    super();
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

  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override code!: string;

  @ApiProperty({ type: 'string' })
  override title!: string;

  @ApiProperty({ type: 'boolean' })
  override isRequired!: boolean;

  @ApiProperty({ type: 'number' })
  override sortOrder!: number;

  @ApiProperty({ type: 'string' })
  override version!: string;

  @ApiProperty({ type: 'string' })
  override content!: string;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override publishedAt!: Date | null;

  @ApiProperty({ type: 'boolean' })
  override isPublished!: boolean;

  @ApiProperty({ type: 'boolean' })
  override isDraft!: boolean;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;
}
