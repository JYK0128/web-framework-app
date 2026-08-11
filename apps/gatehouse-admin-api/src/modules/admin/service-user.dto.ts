import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const SERVICE_USER_STATUSES = ['active', 'suspended'] as const;
export type ServiceUserStatus = (typeof SERVICE_USER_STATUSES)[number];
export const SERVICE_USER_ROLES = ['anonymous', 'user'] as const;
export type ServiceUserRole = (typeof SERVICE_USER_ROLES)[number];

export class ServiceUsersQueryDto {
  @ApiPropertyOptional({ example: 'kim@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: ['all', ...SERVICE_USER_STATUSES], default: 'all' })
  @IsOptional()
  @IsIn(['all', ...SERVICE_USER_STATUSES])
  status: 'all' | ServiceUserStatus = 'all';

  @ApiPropertyOptional({ example: 50, default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}

export class ServiceUpdateUserStatusRequestDto {
  @ApiProperty({ enum: SERVICE_USER_STATUSES, example: 'suspended' })
  @IsIn(SERVICE_USER_STATUSES)
  status!: ServiceUserStatus;
}

export class ServiceUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Service User' })
  name!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ enum: SERVICE_USER_STATUSES })
  status!: ServiceUserStatus;

  @ApiProperty({ enum: SERVICE_USER_ROLES, nullable: true })
  role!: ServiceUserRole | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time', nullable: true })
  lastLoginAt!: Date | null;
}

export class ServiceUsersResponseDto {
  @ApiProperty({ type: () => [ServiceUserDto] })
  users!: ServiceUserDto[];

  @ApiProperty()
  total!: number;
}

export class ServiceOverviewResponseDto {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty()
  activeUsers!: number;

  @ApiProperty()
  suspendedUsers!: number;

  @ApiProperty()
  newUsersToday!: number;
}
