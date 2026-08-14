/** Application-wide routes and infrastructure policies. */
export const API_PREFIX = 'api/v1';
export const AUTH_ROUTE = 'auth';

/** Fixed global request rate-limit policy. */
export const REQUEST_RATE_LIMIT_TTL_MS = 60 * 1000;
export const REQUEST_RATE_LIMIT_MAX_REQUESTS = 120;
