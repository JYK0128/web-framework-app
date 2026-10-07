import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsString, IsUUID, ValidateNested } from 'class-validator';

import { AgreementMetadataDto } from './term-agreement-item.dto';

export class SetAgreementItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsString()
  @IsUUID()
  id!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isAgreed!: boolean;

  @ApiProperty({ type: () => AgreementMetadataDto, required: false, nullable: true })
  @ValidateNested()
  @Type(() => AgreementMetadataDto)
  metadata?: AgreementMetadataDto | null;
}

export class SetAgreementsRequestDto {
  @ApiProperty({ type: [SetAgreementItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetAgreementItemDto)
  agreements!: SetAgreementItemDto[];
}
