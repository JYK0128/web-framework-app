import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { Term, type UserTermAgreement } from '#/core/database/entities/terms';
import { EntityDto } from '#/core/http/dto/base/entity.dto';

import { ServiceAgreementMetadataDto } from './service-agreement-metadata.dto';

@ApiSchema({ name: 'ServiceTermAgreementItem' })
export class ServiceTermAgreementItemDto extends EntityDto(Term) {
  @ApiProperty() termId!: string;
  @ApiProperty() groupId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() version!: string;
  @ApiProperty() content!: string;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() isAgreed!: boolean;
  @ApiProperty({ type: Date, nullable: true }) agreedAt!: Date | null;
  @ApiPropertyOptional({ type: () => ServiceAgreementMetadataDto, nullable: true })
  @Type(() => ServiceAgreementMetadataDto)
  metadata?: ServiceAgreementMetadataDto | null;

  @ApiPropertyOptional({ type: () => ServiceAgreementMetadataDto, nullable: true })
  @Type(() => ServiceAgreementMetadataDto)
  agreementMetadata?: ServiceAgreementMetadataDto | null;

  static override parseEntity(term: Term, agreement?: UserTermAgreement): ServiceTermAgreementItemDto {
    return this.parse({
      termId: term.id,
      groupId: term.termGroup.id,
      title: term.termGroup.title,
      version: term.version,
      content: term.content,
      isRequired: term.termGroup.isRequired,
      isAgreed: agreement?.isAgreed === true,
      agreedAt: agreement?.createdAt ?? null,
      metadata: ServiceAgreementMetadataDto.parseMetadata(term.metadata),
      agreementMetadata: ServiceAgreementMetadataDto.parseMetadata(agreement?.metadata ?? null),
    });
  }
}
