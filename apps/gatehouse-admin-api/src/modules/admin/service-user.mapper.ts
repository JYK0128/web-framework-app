import { User } from '#/entities/auth/user.entity';

import { ServiceUserDto } from './service-user.dto';

export function toServiceUserDto(user: User): ServiceUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.isBanned ? 'suspended' : 'active',
    role: toServiceUserRole(user.role),
    createdAt: user.createdAt,
    lastLoginAt: readDate(user.metadata?.lastLoginAt),
  };
}

function toServiceUserRole(role: unknown): ServiceUserDto['role'] {
  const normalizedRole = String(role);
  if (normalizedRole === 'user') return 'user';
  return null;
}

function readDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
