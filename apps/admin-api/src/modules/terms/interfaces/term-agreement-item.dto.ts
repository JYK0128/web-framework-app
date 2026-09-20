import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base/base.dto';
import { Term } from '#/entities/terms/term.entity';

export type AgreementOptionValue = boolean | string | number | null;

export class AgreementMetadataDto {
  @ApiPropertyOptional({
    type: 'object',
    nullable: true,
    additionalProperties: {
      oneOf: [
        { type: 'boolean' },
        { type: 'string' },
        { type: 'number' },
        { type: 'null' },
      ],
    },
  })
  options?: Record<string, AgreementOptionValue> | null;
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
