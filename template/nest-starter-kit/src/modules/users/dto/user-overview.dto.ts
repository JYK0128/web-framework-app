import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/dto/base.dto';

export class UserOverviewDto extends BaseDto {
  @ApiProperty({ type: 'number' })
  totalUsers!: number;

  @ApiProperty({ type: 'number' })
  adminUsers!: number;

  @ApiProperty({ type: 'number' })
  twoFactorEnabledUsers!: number;

  @ApiProperty({ type: 'number' })
  regularUsers!: number;
}
