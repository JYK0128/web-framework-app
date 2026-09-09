import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { AgreementMetadataDto } from '#/modules/terms/dto/agreement.dto';

export class TermAgreementItemDto extends EntityDto(Term) {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  override id!: string;

  @ApiProperty({ type: 'boolean' })
  @IsBoolean()
  isAgreed!: boolean;

  @ApiPropertyOptional({
    type: () => AgreementMetadataDto,
    description: '채널별 동의 상세 정보. 마케팅 약관에서 사용합니다.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgreementMetadataDto)
  metadata?: AgreementMetadataDto;
}
export class SetAgreementsRequestDto extends EntityDto(UserTermAgreement) {
  @ApiProperty({ type: [TermAgreementItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TermAgreementItemDto)
  agreements!: TermAgreementItemDto[];
}
