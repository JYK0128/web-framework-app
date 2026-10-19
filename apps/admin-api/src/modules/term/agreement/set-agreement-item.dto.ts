import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, IsUUID, ValidateNested } from 'class-validator';

import { AgreementMetadataDto } from '#/modules/term/agreement/agreement-metadata.dto';

export class SetAgreementItemDto extends BaseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsString()
  @IsUUID()
  termId!: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isAgreed!: boolean;

  @ApiProperty({ type: () => AgreementMetadataDto, required: false, nullable: true })
  @ValidateNested()
  @Type(() => AgreementMetadataDto)
  metadata?: AgreementMetadataDto | null;
}
