import { ApiProperty } from '@nestjs/swagger';

export class UserOverviewDto {
  @ApiProperty({ example: 120 })
  totalUsers!: number;

  @ApiProperty({ example: 4 })
  adminUsers!: number;

  @ApiProperty({ example: 36 })
  twoFactorEnabledUsers!: number;

  @ApiProperty({ example: 116 })
  regularUsers!: number;
}
