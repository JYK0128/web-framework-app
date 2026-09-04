/** Application-wide routes and infrastructure policies. */
export const API_PREFIX = 'api/v1';
export const AUTH_ROUTE = 'auth';

/** Fixed global request rate-limit policy. */
export const REQUEST_RATE_LIMIT_TTL_MS = 60 * 1000;
export const REQUEST_RATE_LIMIT_MAX_REQUESTS = 120;

/** Fixed database-backed session policy. */
export const SESSION_TTL_SECONDS = 30 * 60;
export const SESSION_REMEMBER_ME_TTL_SECONDS = 30 * 24 * 60 * 60;

/** Fixed password expiration policy. */
export const PASSWORD_EXPIRATION_DAYS = 90;
