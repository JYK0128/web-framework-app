import type { Request } from 'express';

import { env } from '~/config/env';

const isProduction = env.NODE_ENV === 'production';

export const sessionCookieName = isProduction
  ? '__Host-admin-session'
  : 'admin-session';

export const csrfCookieName = isProduction
  ? '__Host-admin-csrf-token'
  : 'admin-csrf-token';

export function getCookie(req: Request, name: string): string | undefined {
  const value: unknown = req.cookies[name];
  return typeof value === 'string' ? value : undefined;
}
