import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Term } from '#/core/database/entities/terms';
import { EntityDto } from '#/core/http/dto/base/entity.dto';
import { AgreementMetadataDto } from '#/modules/terms/dto/agreement-metadata.dto';

export class TermAgreementItemDto extends EntityDto(Term) {
  @ApiProperty({ type: String })
  termId!: string;

  @ApiProperty({ type: String })
  groupId!: string;

  @ApiProperty({ type: String })
  title!: string;

  @ApiProperty({ type: String })
  version!: string;

  @ApiProperty({ type: String })
  content!: string;

  @ApiProperty({ type: Boolean })
  isRequired!: boolean;

  @ApiProperty({ type: Boolean })
  isAgreed!: boolean;

  @ApiPropertyOptional({ type: () => AgreementMetadataDto, nullable: true })
  metadata?: AgreementMetadataDto | null;

  @ApiPropertyOptional({ type: () => AgreementMetadataDto, nullable: true })
  agreementMetadata?: AgreementMetadataDto | null;

  static override from(term: Term, isAgreed: boolean, agreementMetadata?: Record<string, unknown> | null): TermAgreementItemDto {
    return TermAgreementItemDto.fromPlain({
      termId: term.id,
      groupId: term.termGroup.id,
      title: term.termGroup.title,
      version: term.version,
      content: term.content,
      isRequired: term.termGroup.isRequired,
      isAgreed,
      metadata: term.metadata,
      agreementMetadata,
    });
  }
}
