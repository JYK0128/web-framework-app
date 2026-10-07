import type { ServicePermissionCode } from '@pkg/shared';
import { API_BASE_PATH } from '@pkg/shared/config';

export type PermissionCode = ServicePermissionCode;

export const SYSTEM_CONFIG_REFRESH_INTERVAL_MS = 60_000;
export const OAUTH_PROVIDER_LIST_QUERY_STALE_TIME_MS = 60_000;

export const SILENT_QUERY_PATHS = new Set([
  `${API_BASE_PATH}/auth/me`,
  `${API_BASE_PATH}/health`,
]);
