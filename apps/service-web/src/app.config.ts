import type { ServicePermissionCode } from '@pkg/shared';

export type PermissionCode = ServicePermissionCode;

export const SYSTEM_CONFIG_REFRESH_INTERVAL_MS = 60_000;
export const OAUTH_PROVIDER_LIST_QUERY_STALE_TIME_MS = 60_000;

export const SILENT_QUERY_PATHS = new Set([
  '/api/v1/auth/me',
  '/api/v1/health',
]);
