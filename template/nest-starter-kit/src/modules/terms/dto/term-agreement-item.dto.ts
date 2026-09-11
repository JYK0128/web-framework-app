import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';
import type { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

export class AgreementChannelsDto {
  @ApiPropertyOptional({ type: 'boolean', description: '이메일 수신 동의 여부' })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({ type: 'boolean', description: 'SMS 수신 동의 여부' })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @ApiPropertyOptional({ type: 'boolean', description: '메신저/알림톡 수신 동의 여부' })
  @IsOptional()
  @IsBoolean()
  messenger?: boolean;
}

export class AgreementMetadataDto {
  [key: string]: unknown;

  @ApiPropertyOptional({ type: () => AgreementChannelsDto, description: '채널별 수신 동의' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgreementChannelsDto)
  channels?: AgreementChannelsDto;
}

export class TermAgreementItemDto extends EntityDto(Term, TermGroup) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override version!: string;

  @ApiProperty({ type: 'string' })
  override content!: string;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override publishedAt!: Date | null;

  @ApiProperty({ type: 'string' })
  override code!: string;

  @ApiProperty({ type: 'string' })
  override title!: string;

  @ApiProperty({ type: 'boolean' })
  override isRequired!: boolean;

  @ApiProperty({ type: 'number' })
  override sortOrder!: number;

  @ApiProperty({ type: 'boolean' })
  isAgreed!: boolean;

  @ApiProperty({ type: 'string', nullable: true })
  agreedTermId!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  agreedVersion!: string | null;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override createdAt!: Date | null;

  @ApiPropertyOptional({ type: () => AgreementMetadataDto, nullable: true })
  metadata!: AgreementMetadataDto | null;

  static from(term: Term, agreement?: UserTermAgreement): TermAgreementItemDto {
    return this.fromPlain({
      id: term.id,
      version: term.version,
      content: term.content,
      publishedAt: term.publishedAt ?? null,
      code: term.termGroup.code,
      title: term.termGroup.title,
      isRequired: term.termGroup.isRequired,
      sortOrder: term.termGroup.sortOrder,
      isAgreed: agreement?.isAgreed === true && agreement.term.id === term.id,
      agreedTermId: agreement?.term?.id ?? null,
      agreedVersion: agreement?.term?.version ?? null,
      createdAt: agreement?.createdAt ?? null,
      metadata: agreement?.metadata ?? null,
    });
  }
}
