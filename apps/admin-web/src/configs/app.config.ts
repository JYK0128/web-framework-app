import type { AdminPermissionCode } from '@pkg/shared';
import { API_BASE_PATH } from '@pkg/shared/config';

export type PermissionCode = AdminPermissionCode;

export const API_PREFIX = API_BASE_PATH;

export const SILENT_QUERY_PATHS = new Set([
  `${API_PREFIX}/auth/me`,
  `${API_PREFIX}/health`,
]);

export const SUPPORT_ROOM_MESSAGE_REFRESH_INTERVAL_MS = 5_000;
