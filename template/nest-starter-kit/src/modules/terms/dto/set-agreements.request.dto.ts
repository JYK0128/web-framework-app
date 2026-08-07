import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Term } from '#/entities/terms/term.entity';

export class TermAgreementItemDto extends DtoType(Term, ['id'] as const) {
  @ApiProperty({ description: 'Term ID (UUID)' })
  @IsString()
  @IsNotEmpty()
  override id!: string;

  @ApiProperty({ description: 'Agreement status (true: agree, false: withdraw)' })
  @IsBoolean()
  isAgreed!: boolean;
}

export class SetAgreementsRequestDto {
  @ApiProperty({ type: [TermAgreementItemDto], description: 'Desired agreement states for terms' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TermAgreementItemDto)
  agreements!: TermAgreementItemDto[];
}
