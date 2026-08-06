import { ApiProperty, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

export class AgreementDto extends IntersectionType(
  DtoType(Term, ['id', 'version', 'content', 'publishedAt'] as const),
  DtoType(TermGroup, ['code', 'title', 'isRequired'] as const),
  DtoType(UserTermAgreement, ['agreedAt'] as const),
) {
  @ApiProperty()
  override id!: string;

  @ApiProperty()
  override version!: string;

  @ApiProperty()
  override content!: string;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true, required: false })
  override publishedAt!: Date | null;

  @ApiProperty()
  override code!: string;

  @ApiProperty()
  override title!: string;

  @ApiProperty()
  override isRequired!: boolean;

  @ApiProperty()
  isAgreed!: boolean;

  @ApiPropertyOptional({ type: Date, format: 'date-time', nullable: true, required: false })
  override agreedAt!: Date | null;
}
