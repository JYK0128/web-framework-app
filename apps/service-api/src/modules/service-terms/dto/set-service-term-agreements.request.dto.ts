import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ServiceTermAgreementInputDto {
  @ApiProperty() @IsString() termId!: string;
  @ApiProperty() @IsBoolean() isAgreed!: boolean;
}

@ApiSchema({ name: 'SetServiceTermAgreementsRequest' })
export class SetServiceTermAgreementsRequestDto {
  @ApiProperty({ type: [ServiceTermAgreementInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceTermAgreementInputDto)
  agreements!: ServiceTermAgreementInputDto[];
}
