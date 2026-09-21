import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/common/interfaces/base';

export class GetUserOverviewResponseDto extends BaseDto {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty()
  activeUsers!: number;

  @ApiProperty()
  bannedUsers!: number;

  @ApiProperty()
  deletedUsers!: number;

  @ApiProperty()
  twoFactorEnabledUsers!: number;
}
