import { getEnv } from '../env';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_SECONDS = 30 * 60;

export const AUTH_REFRESH_PATH = '/api/v1/auth/token/refresh';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: getEnv().NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};
