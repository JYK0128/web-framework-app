import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';
import { Term } from '#/entities/terms/term.entity';

export class AgreementOptionsDto {
  @ApiPropertyOptional({ type: Boolean })
  email?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  sms?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  messenger?: boolean;
}

export class AgreementMetadataDto {
  @ApiPropertyOptional({ type: () => AgreementOptionsDto, nullable: true })
  options?: AgreementOptionsDto | null;
}

export class TermAgreementItemDto extends BaseDto {
  @ApiProperty({ type: String })
  id!: string;

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

  @ApiPropertyOptional({ type: () => AgreementMetadataDto, nullable: true })
  metadata?: AgreementMetadataDto | null;

  static from(term: Term, isAgreed: boolean, metadata?: Record<string, unknown> | null): TermAgreementItemDto {
    return TermAgreementItemDto.fromPlain({
      id: term.id,
      code: term.termGroup.code,
      title: term.termGroup.title,
      version: term.version,
      content: term.content,
      isRequired: term.termGroup.isRequired,
      isAgreed,
      metadata,
    });
  }
}
