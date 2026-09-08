import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';

export class TermAgreementItemDto extends DtoType(Term) {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  override id!: string;

  @ApiProperty({ type: 'boolean' })
  @IsBoolean()
  isAgreed!: boolean;
}
export class SetAgreementsRequestDto extends DtoType(UserTermAgreement) {
  @ApiProperty({ type: [TermAgreementItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TermAgreementItemDto)
  agreements!: TermAgreementItemDto[];
}
