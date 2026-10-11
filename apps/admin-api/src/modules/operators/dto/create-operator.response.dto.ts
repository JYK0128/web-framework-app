import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';

@ApiSchema({ name: 'OperatorCreateResponse' })
export class CreateOperatorResponseDto extends BaseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  emailVerificationRequired!: boolean;

  @ApiProperty()
  emailVerificationSent!: boolean;
}
