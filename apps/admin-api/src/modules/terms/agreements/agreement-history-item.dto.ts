import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserTermAgreement } from '#/core/database/entities/terms';
import { EntityDto } from '#/core/http/dto/base/entity.dto';
import { AgreementMetadataDto } from '#/modules/terms/agreements/agreement-metadata.dto';

export class AgreementHistoryItemDto extends EntityDto(UserTermAgreement) {
  @ApiProperty({ type: String })
  id!: string;

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

  @ApiProperty({ type: Date, format: 'date-time' })
  createdAt!: Date;

  @ApiPropertyOptional({ type: () => AgreementMetadataDto, nullable: true })
  metadata?: AgreementMetadataDto | null;

  static override parseEntity(agreement: UserTermAgreement): AgreementHistoryItemDto {
    return this.parse({
      id: agreement.id,
      termId: agreement.term.id,
      groupId: agreement.term.termGroup.id,
      title: agreement.term.termGroup.title,
      version: agreement.term.version,
      content: agreement.term.content,
      isRequired: agreement.term.termGroup.isRequired,
      isAgreed: agreement.isAgreed,
      createdAt: agreement.createdAt,
      metadata: agreement.metadata,
    });
  }
}
