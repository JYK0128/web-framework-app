import type { CookieOptions } from 'express';

import { env } from '#/env';

export const SESSION_COOKIE = 'session';

export function getSessionCookieOptions(overrides?: CookieOptions): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...overrides,
  };
}
