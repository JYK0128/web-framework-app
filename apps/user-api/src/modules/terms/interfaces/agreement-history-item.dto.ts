import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

import { AgreementMetadataDto } from './term-agreement-item.dto';

export class AgreementHistoryItemDto extends BaseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: String })
  termId!: string;

  @ApiProperty({ type: String })
  code!: string;

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

  static from(agreement: UserTermAgreement): AgreementHistoryItemDto {
    return AgreementHistoryItemDto.fromPlain({
      id: agreement.id,
      termId: agreement.term.id,
      code: agreement.term.termGroup.code,
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
