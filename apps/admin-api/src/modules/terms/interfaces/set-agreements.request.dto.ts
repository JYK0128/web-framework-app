import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsString, IsUUID, ValidateNested } from 'class-validator';

export class SetAgreementItemDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsString()
  @IsUUID()
  id!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isAgreed!: boolean;
}

export class SetAgreementsRequestDto {
  @ApiProperty({ type: [SetAgreementItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetAgreementItemDto)
  agreements!: SetAgreementItemDto[];
}
