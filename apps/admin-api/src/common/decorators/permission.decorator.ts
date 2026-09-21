import { SetMetadata } from '@nestjs/common';
import type { PermissionDefinition } from '@pkg/shared';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: PermissionDefinition[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions.map((permission) => permission.code));
