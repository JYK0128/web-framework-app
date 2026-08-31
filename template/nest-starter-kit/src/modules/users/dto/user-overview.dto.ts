import { ApiProperty } from '@nestjs/swagger';

export class UserOverviewDto {
  constructor(totalUsers: number, adminUsers: number, twoFactorEnabledUsers: number, regularUsers: number) {
    this.totalUsers = totalUsers;
    this.adminUsers = adminUsers;
    this.twoFactorEnabledUsers = twoFactorEnabledUsers;
    this.regularUsers = regularUsers;
  }

  @ApiProperty({ type: 'number' })
  totalUsers!: number;

  @ApiProperty({ type: 'number' })
  adminUsers!: number;

  @ApiProperty({ type: 'number' })
  twoFactorEnabledUsers!: number;

  @ApiProperty({ type: 'number' })
  regularUsers!: number;
}
