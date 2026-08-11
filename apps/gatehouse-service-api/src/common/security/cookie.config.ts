import type { CookieOptions } from 'express';

import { env } from '#/env';

/**
 * Opaque cookie names used by the application.
 *
 * These values are intentionally kept out of environment variables and are
 * generated once when the template is provisioned. They are identifiers, not
 * secrets; cookie values and APP_SECRET still provide the security boundary.
 */
export const cookieNames = {
  session: 'K7mQ2',
  csrf: 'vP4xN',
  twoFactor: '9aRkL',
} as const;

export function getCookieOptions<T extends object = {}>(overrides?: CookieOptions & T): CookieOptions & T {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
    ...overrides,
  } as CookieOptions & T;
}
