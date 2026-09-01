import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export type PermissionName = `${string}:${string}`;

export const Permission = (...permissions: PermissionName[]) => SetMetadata(PERMISSION_KEY, permissions);
