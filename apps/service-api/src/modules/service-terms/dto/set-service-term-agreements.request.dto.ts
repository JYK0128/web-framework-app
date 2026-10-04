import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { ServiceAgreementMetadataDto } from './service-agreement-metadata.dto';

class ServiceTermAgreementInputDto {
  @ApiProperty() @IsString() @IsUUID() termId!: string;
  @ApiProperty() @IsBoolean() isAgreed!: boolean;
  @ApiPropertyOptional({ type: () => ServiceAgreementMetadataDto, nullable: true })
  @IsOptional() @ValidateNested() @Type(() => ServiceAgreementMetadataDto)
  metadata?: ServiceAgreementMetadataDto | null;
}

@ApiSchema({ name: 'SetServiceTermAgreementsRequest' })
export class SetServiceTermAgreementsRequestDto {
  @ApiProperty({ type: [ServiceTermAgreementInputDto] })
  @IsArray()
  @ArrayUnique((item: ServiceTermAgreementInputDto) => item.termId)
  @ValidateNested({ each: true })
  @Type(() => ServiceTermAgreementInputDto)
  agreements!: ServiceTermAgreementInputDto[];
}
