import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base';

@ApiSchema({ name: 'OperatorOverviewResponse' })
export class GetOperatorOverviewResponseDto extends BaseDto {
  @ApiProperty()
  totalOperators!: number;

  @ApiProperty()
  activeOperators!: number;

  @ApiProperty()
  bannedOperators!: number;

  @ApiProperty()
  deletedOperators!: number;

  @ApiProperty()
  twoFactorEnabledOperators!: number;
}
