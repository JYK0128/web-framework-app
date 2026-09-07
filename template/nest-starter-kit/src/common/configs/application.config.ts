import type { CookieOptions } from 'express';

import { env } from '#/env';

export const API_PREFIX = 'api/v1';
export const AUTH_ROUTE = 'auth';
export const REQUEST_RATE_LIMIT_TTL_MS = 60 * 1000;
export const REQUEST_RATE_LIMIT_MAX_REQUESTS = 120;
export const ALERT_LIST_DEFAULT_LIMIT = 50;
export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_DEFAULT_PAGE = 1;
export const BODY_PARSER_LIMIT = '10mb';
export const REQUEST_ID_HEADER = 'x-request-id';
export const MAINTENANCE_EXEMPT_PATH_PREFIXES = ['/health', '/system-config', '/auth/login', '/auth/2fa', '/auth/logout', '/auth/profile'] as const;
export const SESSION_TTL_SECONDS = 30 * 60;
export const SESSION_REMEMBER_ME_TTL_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_COOKIE = 'session';

export function getSessionCookieOptions(overrides?: CookieOptions): CookieOptions {
  return { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/', ...overrides };
}
