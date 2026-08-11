import { ClsService } from 'nestjs-cls';

import { User } from '#/entities/auth/user.entity';

import { AdminUserDto } from './admin.dto';

export function toAdminUserDto(user: User): AdminUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.deletedAt ? 'suspended' : 'active',
    isAdmin: user.metadata?.isAdmin === true,
    createdAt: user.createdAt,
    lastLoginAt: readDate(user.metadata?.lastLoginAt),
  };
}

export function getCurrentUserId(cls: ClsService): string | null {
  const user = cls.get('user');
  if (!user || typeof user !== 'object' || !('id' in user) || typeof user.id !== 'string') return null;
  return user.id;
}

function readDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
