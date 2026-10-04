import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

@ApiSchema({ name: 'ServiceTermAgreementItem' })
export class ServiceTermAgreementItemDto extends BaseDto {
  @ApiProperty() termId!: string;
  @ApiProperty() groupId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() version!: string;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() isAgreed!: boolean;
  @ApiProperty({ type: String, nullable: true }) agreedAt!: Date | null;
}
