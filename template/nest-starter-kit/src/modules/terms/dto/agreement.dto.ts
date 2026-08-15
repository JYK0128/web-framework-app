import { ApiProperty } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';

export class AgreementDto extends DtoType(Term, TermGroup) {
  @ApiProperty()
  override id!: string;

  @ApiProperty()
  override version!: string;

  @ApiProperty()
  override content!: string;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override publishedAt!: Date | null;

  @ApiProperty()
  override code!: string;

  @ApiProperty()
  override title!: string;

  @ApiProperty()
  override isRequired!: boolean;

  @ApiProperty({ example: 1 })
  override sortOrder!: number;

  @ApiProperty()
  isAgreed!: boolean;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override createdAt!: Date | null;
}
