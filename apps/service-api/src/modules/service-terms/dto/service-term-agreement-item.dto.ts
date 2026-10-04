import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { EntityDto } from '#/common/interfaces/base/entity.dto';
import { Term } from '#/entities/terms/term.entity';
import type { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

import { ServiceAgreementMetadataDto } from './service-agreement-metadata.dto';

@ApiSchema({ name: 'ServiceTermAgreementItem' })
export class ServiceTermAgreementItemDto extends EntityDto(Term) {
  @ApiProperty() termId!: string;
  @ApiProperty() groupId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() version!: string;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() isAgreed!: boolean;
  @ApiProperty({ type: Date, nullable: true }) agreedAt!: Date | null;
  @ApiPropertyOptional({ type: () => ServiceAgreementMetadataDto, nullable: true })
  @Type(() => ServiceAgreementMetadataDto)
  metadata?: ServiceAgreementMetadataDto | null;

  @ApiPropertyOptional({ type: () => ServiceAgreementMetadataDto, nullable: true })
  @Type(() => ServiceAgreementMetadataDto)
  agreementMetadata?: ServiceAgreementMetadataDto | null;

  static override from(term: Term, agreement?: UserTermAgreement): ServiceTermAgreementItemDto {
    return this.fromPlain({
      termId: term.id,
      groupId: term.termGroup.id,
      title: term.termGroup.title,
      version: term.version,
      isRequired: term.termGroup.isRequired,
      isAgreed: agreement?.isAgreed === true,
      agreedAt: agreement?.createdAt ?? null,
      metadata: ServiceAgreementMetadataDto.fromMetadata(term.metadata),
      agreementMetadata: ServiceAgreementMetadataDto.fromMetadata(agreement?.metadata ?? null),
    });
  }
}
