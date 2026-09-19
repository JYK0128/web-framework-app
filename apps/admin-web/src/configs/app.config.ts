export const API_PREFIX = '/api/v1';

export const SILENT_QUERY_PATHS = new Set([
  `${API_PREFIX}/auth/me`,
  `${API_PREFIX}/health`,
]);
