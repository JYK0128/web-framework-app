import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';

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
