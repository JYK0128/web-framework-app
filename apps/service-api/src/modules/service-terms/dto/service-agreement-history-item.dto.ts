import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EntityDto } from '#/common/interfaces/base/entity.dto';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

import { ServiceAgreementMetadataDto } from './service-agreement-metadata.dto';

export class ServiceAgreementHistoryItemDto extends EntityDto(UserTermAgreement) {
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

  @ApiPropertyOptional({ type: () => ServiceAgreementMetadataDto, nullable: true })
  metadata?: ServiceAgreementMetadataDto | null;

  static override from(agreement: UserTermAgreement): ServiceAgreementHistoryItemDto {
    return ServiceAgreementHistoryItemDto.fromPlain({
      id: agreement.id,
      termId: agreement.term.id,
      groupId: agreement.term.termGroup.id,
      title: agreement.term.termGroup.title,
      version: agreement.term.version,
      content: agreement.term.content,
      isRequired: agreement.term.termGroup.isRequired,
      isAgreed: agreement.isAgreed,
      createdAt: agreement.createdAt,
      metadata: ServiceAgreementMetadataDto.fromMetadata(agreement.metadata),
    });
  }
}
