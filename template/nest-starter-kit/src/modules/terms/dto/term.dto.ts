import { ApiProperty } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';

export class TermDto extends DtoType(Term, TermGroup) {
  constructor(term: Term) {
    super();
    this.id = term.id;
    this.version = term.version;
    this.content = term.content;
    this.publishedAt = term.publishedAt ?? null;
    this.code = term.termGroup.code;
    this.title = term.termGroup.title;
    this.isRequired = term.termGroup.isRequired;
    this.sortOrder = term.termGroup.sortOrder;
  }

  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override version!: string;

  @ApiProperty({ type: 'string' })
  override content!: string;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override publishedAt!: Date | null;

  @ApiProperty({ type: 'string' })
  override code!: string;

  @ApiProperty({ type: 'string' })
  override title!: string;

  @ApiProperty({ type: 'boolean' })
  override isRequired!: boolean;

  @ApiProperty({ type: 'number' })
  override sortOrder!: number;
}
