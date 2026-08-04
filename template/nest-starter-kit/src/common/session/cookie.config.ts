import type { CookieOptions } from 'express';

import { env } from '#/env';

export function getCookieOptions<T extends object = {}>(overrides?: CookieOptions & T): CookieOptions & T {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
    ...overrides,
  } as CookieOptions & T;
}
