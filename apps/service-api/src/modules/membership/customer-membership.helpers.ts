import { HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { Permission } from '~/core/database/entities/auth.extensions';
import { AppEntityManager } from '~/core/database/entity-manager';

export async function normalizePermissions(em: AppEntityManager, permissions?: string[]): Promise<string[]> {
  const normalized = [...new Set((permissions ?? []).map((permission) => permission.trim().toLowerCase()).filter(Boolean))];

  if (normalized.length === 0) return [];

  const storedPermissions = await em.find(
    Permission,
    { code: { $in: normalized }, deletedAt: null },
    { filters: false },
  );
  const known = new Set(storedPermissions.map(({ code }) => code));
  const invalid = normalized.filter((permission) => !known.has(permission));
  if (invalid.length > 0) throw new ApplicationError({ code: 'CUSTOMER_MEMBERSHIP_PERMISSIONS_INVALID', status: HttpStatus.BAD_REQUEST, details: { permissions: invalid } });
  return normalized;
}
