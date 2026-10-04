import { SetMetadata } from '@nestjs/common';
import type { PermissionDefinition } from '@pkg/shared';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: (PermissionDefinition | string)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions.map((permission) => typeof permission === 'string' ? permission : permission.code));

export const Permission = Permissions;
