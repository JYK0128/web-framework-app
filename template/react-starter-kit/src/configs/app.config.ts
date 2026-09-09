export const API_PREFIX = '/api/v1';
export const AUTH_OAUTH_PATH = `${API_PREFIX}/auth/oauth`;
export const SILENT_QUERY_PATHS = new Set([`${API_PREFIX}/auth/me`, `${API_PREFIX}/health`]);
export const SILENT_MUTATION_PATHS = new Set([`${API_PREFIX}/auth/logout`, `${API_PREFIX}/auth/consent/sync`]);
