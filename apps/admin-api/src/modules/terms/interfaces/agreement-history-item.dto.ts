import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EntityResponseDto } from '#/common/interfaces/base';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

import { AgreementMetadataDto } from './term-agreement-item.dto';

export class AgreementHistoryItemDto extends EntityResponseDto(UserTermAgreement) {
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

  static override from(agreement: UserTermAgreement): AgreementHistoryItemDto {
    return AgreementHistoryItemDto.fromPlain({
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
