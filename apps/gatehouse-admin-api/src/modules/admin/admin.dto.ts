import type { EntityDTO } from '@mikro-orm/core';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { ROLE_NAMES } from '#/entities/auth/role.entity';
import { User } from '#/entities/auth/user.entity';

export const ADMIN_USER_STATUSES = ['active', 'suspended'] as const;
export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];
export const ADMIN_USER_ROLES = [ROLE_NAMES.ADMIN, ROLE_NAMES.SUPER_ADMIN] as const;
export type AdminUserRole = (typeof ADMIN_USER_ROLES)[number];

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
  constructor(user?: User | EntityDTO<User>) {
    if (!user) return;

    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.status = user.isBanned ? 'suspended' : 'active';
    this.role = this.toAdminRole(user.role);
    this.createdAt = user.createdAt;
    this.lastLoginAt = this.readDate(user.metadata?.lastLoginAt);
  }

  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Seed User' })
  name!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ enum: ADMIN_USER_STATUSES })
  status!: AdminUserStatus;

  @ApiProperty({ enum: ADMIN_USER_ROLES, nullable: true })
  role!: AdminUserRole | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time', nullable: true })
  lastLoginAt!: Date | null;

  private toAdminRole(role: unknown): AdminUserDto['role'] {
    const normalizedRole = String(role);
    if (normalizedRole === ROLE_NAMES.ADMIN) return ROLE_NAMES.ADMIN;
    if (normalizedRole === ROLE_NAMES.SUPER_ADMIN) return ROLE_NAMES.SUPER_ADMIN;
    return null;
  }

  private readDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
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
