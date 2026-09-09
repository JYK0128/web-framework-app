import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EntityDto } from '#/common/dto/entity-dto';
import { ListResponseDto } from '#/common/interfaces';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AgreementMetadataDto } from '#/modules/terms/dto/agreement.dto';

export class AgreementHistoryItemDto extends EntityDto(UserTermAgreement) {
  @ApiProperty({ type: 'string' })
  id!: string;

  @ApiProperty({ type: 'string' })
  termId!: string;

  @ApiProperty({ type: 'string' })
  version!: string;

  @ApiProperty({ type: 'string' })
  content!: string;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ type: 'string' })
  code!: string;

  @ApiProperty({ type: 'string' })
  title!: string;

  @ApiProperty({ type: 'boolean' })
  isRequired!: boolean;

  @ApiProperty({ type: 'boolean' })
  isAgreed!: boolean;

  @ApiProperty({ type: Date, format: 'date-time' })
  createdAt!: Date;

  @ApiPropertyOptional({ type: () => AgreementMetadataDto, nullable: true })
  metadata?: AgreementMetadataDto | null;
}
export class GetAgreementHistoryResponseDto extends ListResponseDto<AgreementHistoryItemDto> {
  @ApiProperty({ type: () => [AgreementHistoryItemDto] })
  override items!: AgreementHistoryItemDto[];
}
