import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

import { EntityDto } from '#/common/dto/entity-dto';
import { ListResponseDto } from '#/common/interfaces';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AgreementMetadataDto } from '#/modules/terms/dto/term-agreement-item.dto';

type AgreementPlain = UserTermAgreement & {
  termId?: string
  version?: string
  content?: string
  publishedAt?: Date | null
  code?: string
  title?: string
  isRequired?: boolean
};

export class AgreementHistoryItemDto extends EntityDto(UserTermAgreement) {
  @ApiProperty({ type: 'string' })
  id!: string;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: AgreementPlain }) => (obj.term)?.id ?? obj.termId)
  termId!: string;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: AgreementPlain }) => (obj.term)?.version ?? obj.version)
  version!: string;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: AgreementPlain }) => (obj.term)?.content ?? obj.content)
  content!: string;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  @Transform(({ obj }: { obj: AgreementPlain }) => (obj.term)?.publishedAt ?? obj.publishedAt ?? null)
  publishedAt!: Date | null;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: AgreementPlain }) => (obj.term)?.termGroup?.code ?? obj.code)
  code!: string;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: AgreementPlain }) => (obj.term)?.termGroup?.title ?? obj.title)
  title!: string;

  @ApiProperty({ type: 'boolean' })
  @Transform(({ obj }: { obj: AgreementPlain }) => (obj.term)?.termGroup?.isRequired ?? obj.isRequired)
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
  @Type(() => AgreementHistoryItemDto)
  override items!: AgreementHistoryItemDto[];
}
