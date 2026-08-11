import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const ADMIN_USER_STATUSES = ['active', 'suspended'] as const;
export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];

export class AdminUsersQueryDto {
  @ApiPropertyOptional({ example: 'kim@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: ['all', ...ADMIN_USER_STATUSES], default: 'all' })
  @IsOptional()
  @IsIn(['all', ...ADMIN_USER_STATUSES])
  status: 'all' | AdminUserStatus = 'all';

  @ApiPropertyOptional({ example: 50, default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}

export class AdminUpdateUserStatusRequestDto {
  @ApiProperty({ enum: ADMIN_USER_STATUSES, example: 'suspended' })
  @IsIn(ADMIN_USER_STATUSES)
  status!: AdminUserStatus;
}

export class AdminUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Seed User' })
  name!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ enum: ADMIN_USER_STATUSES })
  status!: AdminUserStatus;

  @ApiProperty()
  isAdmin!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time', nullable: true })
  lastLoginAt!: Date | null;
}

export class AdminUsersResponseDto {
  @ApiProperty({ type: () => [AdminUserDto] })
  users!: AdminUserDto[];

  @ApiProperty()
  total!: number;
}

export class AdminOverviewResponseDto {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty()
  activeUsers!: number;

  @ApiProperty()
  suspendedUsers!: number;

  @ApiProperty()
  newUsersToday!: number;
}
