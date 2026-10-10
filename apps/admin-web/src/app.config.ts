import type { AdminPermissionCode } from '@pkg/shared';

export type PermissionCode = AdminPermissionCode;

export const SILENT_QUERY_PATHS = new Set([
  '/api/v1/auth/me',
  '/api/v1/health',
]);
